import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import Order from '../models/order.model.js';
import auth from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Cấu hình API key
const API_KEY = process.env.COINBASE_TEST_API_KEY || 'your_test_api_key';

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

        console.log('Creating payment with:', {
            userId,
            addressId,
            totalAmt
        });

        // Tạo đơn hàng trong database
        const order = new Order({
            userId,
            list_items,
            addressId,
            totalAmt,
            paymentMethod: 'crypto',
            paymentStatus: 'pending',
            orderStatus: 'pending'
        });

        await order.save();
        console.log('Order created:', order._id);

        // Tạo charge với Coinbase Commerce API
        const chargeData = {
            name: `Order #${order._id}`,
            description: 'Test payment',
            pricing_type: 'fixed_price',
            local_price: {
                amount: totalAmt.toString(),
                currency: 'USD'
            },
            metadata: {
                orderId: order._id.toString()
            },
            redirect_url: `${FRONTEND_URL}/order/success`,
            cancel_url: `${FRONTEND_URL}/order/cancel`,
            // URL webhook (cần thiết lập trên Coinbase Dashboard)
            webhook_url: `${BACKEND_URL}/api/crypto/webhook`
        };

        console.log('Charge data:', chargeData);

        const response = await axios.post(
            'https://api.commerce.coinbase.com/charges',
            chargeData,
            {
                headers: {
                    'X-CC-Api-Key': API_KEY,
                    'X-CC-Version': '2018-03-22',
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Coinbase response:', response.data);

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Error creating charge:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to create charge',
            details: error.response?.data || error.message
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