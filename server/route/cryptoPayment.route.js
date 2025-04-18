import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import Order from '../models/order.model.js';
import auth from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Tỷ giá VND sang USD (cố định)
const VND_TO_USD_RATE = 0.000041; // 1 VND ≈ 0.000041 USD (tỷ giá tham khảo)

// Hàm chuyển đổi VND sang USD
const convertVNDtoUSD = async (amountVND) => {
    try {
        // Cách 1: Dùng Fixed Rate (nhanh, đơn giản nhưng không chính xác theo thời gian thực)
        return parseFloat((amountVND * VND_TO_USD_RATE).toFixed(2));

        // Cách 2: Dùng Exchange Rate API (chính xác nhưng phức tạp hơn)
        // Uncomment code dưới đây và thay API_KEY bằng key của bạn nếu muốn dùng API
        /*
        const response = await axios.get(
            `https://v6.exchangerate-api.com/v6/YOUR_API_KEY/pair/VND/USD/${amountVND}`
        );
        return parseFloat(response.data.conversion_result.toFixed(2));
        */
    } catch (error) {
        console.error('Error converting currency:', error);
        // Fallback to fixed rate if API fails
        return parseFloat((amountVND * VND_TO_USD_RATE).toFixed(2));
    }
};

// Cấu hình URL dựa trên môi trường
const FRONTEND_URL = process.env.NODE_ENV === 'production'
    ? 'https://epay-client.onrender.com'
    : 'http://localhost:5173';

const BACKEND_URL = process.env.NODE_ENV === 'production'
    ? 'https://epay-server.onrender.com'
    : 'http://localhost:8080';

// Route tạo charge
router.post('/create-charge', auth, async (req, res) => {
    try {
        console.log('Request body:', req.body);

        const { list_items, addressId, totalAmt } = req.body;
        const userId = req.userId;

        // Chuyển đổi totalAmt từ VND sang USD
        const totalAmtVND = parseFloat(totalAmt);
        const totalAmtUSD = await convertVNDtoUSD(totalAmtVND);

        console.log(`Converting ${totalAmtVND} VND to ${totalAmtUSD} USD`);

        // Tạo orderId duy nhất
        const orderId = `CRYPTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Lấy sản phẩm đầu tiên từ list_items 
        const firstItem = list_items[0];
        
        // Tạo đơn hàng theo schema hiện tại - Lưu VND trong database
        const order = new Order({
            userId,
            orderId,
            productId: firstItem.productId,
            delivery_address: addressId,
            subTotalAmt: totalAmtVND, // Giữ VND cho DB
            totalAmt: totalAmtVND,    // Giữ VND cho DB
            payment_status: 'pending'
        });

        await order.save();
        console.log('Order created with ID:', order._id);

        // Tạo charge với Coinbase Commerce API - sử dụng USD
        const chargeData = {
            name: `Order #${orderId}`,
            description: 'Payment for e-commerce order',
            pricing_type: 'fixed_price',
            local_price: {
                amount: totalAmtUSD.toString(), // USD amount
                currency: 'USD'
            },
            metadata: {
                orderId: orderId,
                originalAmountVND: totalAmtVND // Lưu lại số tiền VND gốc
            },
            redirect_url: `${process.env.FRONTEND_URL}/order/success`,
            cancel_url: `${process.env.FRONTEND_URL}/order/cancel`,
        };

        console.log('Charge data:', chargeData);

        const response = await axios.post(
            'https://api.commerce.coinbase.com/charges',
            chargeData,
            {
                headers: {
                    'X-CC-Api-Key': process.env.COINBASE_TEST_API_KEY,
                    'X-CC-Version': '2018-03-22',
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Coinbase response:', response.data);

        res.json({
            success: true,
            data: response.data,
            conversionRate: {
                vnd: totalAmtVND,
                usd: totalAmtUSD,
                rate: VND_TO_USD_RATE
            }
        });
    } catch (error) {
        console.error('Error creating charge:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create charge',
            details: error.message
        });
    }
});

// Webhook handler
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-cc-webhook-signature'];
        const payload = req.body;

        console.log('Received webhook:', payload);

        // Verify signature (sử dụng webhook secret từ Coinbase Dashboard)
        const WEBHOOK_SECRET = process.env.COINBASE_TEST_WEBHOOK_SECRET || 'your_webhook_secret';
        const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
        const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');

        if (signature !== calculatedSignature) {
            console.log('Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = payload.event;
        const orderId = event.data.metadata.orderId;

        console.log('Processing webhook for order:', orderId);

        const order = await Order.findById(orderId);
        if (!order) {
            console.log('Order not found:', orderId);
            return res.status(404).json({ error: 'Order not found' });
        }

        // Xử lý các event
        switch (event.type) {
            case 'charge:confirmed':
                order.paymentStatus = 'paid';
                order.orderStatus = 'processing';
                await order.save();
                console.log('Payment confirmed for order:', orderId);
                break;

            case 'charge:failed':
                order.paymentStatus = 'failed';
                order.orderStatus = 'cancelled';
                await order.save();
                console.log('Payment failed for order:', orderId);
                break;

            case 'charge:pending':
                order.paymentStatus = 'pending';
                await order.save();
                console.log('Payment pending for order:', orderId);
                break;

            default:
                console.log('Unhandled event type:', event.type);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export default router; 