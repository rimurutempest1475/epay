import crypto from 'crypto';
import axios from 'axios';
import OrderModel from '../models/order.model.js';
import CartProductModel from '../models/cartproduct.model.js';
import UserModel from '../models/user.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    endpoint: "https://payment.momo.vn/v2/gateway/api/create",
    redirectUrl: process.env.NODE_ENV === 'production' 
        ? "https://epay-client.onrender.com/order/success"
        : "http://localhost:5173/order/success",
    ipnUrl: process.env.NODE_ENV === 'production'
        ? "https://epay-server.onrender.com/api/momo/momo-webhook"
        : "http://localhost:8080/api/momo/momo-webhook",
};

console.log('MoMo Config:', {
    partnerCode: config.partnerCode,
    accessKey: config.accessKey,
    secretKey: '******', // Ẩn secretKey
    endpoint: config.endpoint,
    redirectUrl: config.redirectUrl,
    ipnUrl: config.ipnUrl
});

const createMoMoSignature = (rawSignature) => {
    return crypto
        .createHmac('sha256', config.secretKey)
        .update(rawSignature)
        .digest('hex');
};

export const createMoMoPayment = async (req, res) => {
    try {
        console.log('Received request:', req.body);
        console.log('User from req:', req.userId || req.user?._id);
        
        const { list_items, addressId, totalAmt } = req.body;
        const userId = req.userId || req.user?._id;

        console.log('Request data:', { 
            list_items: list_items, 
            addressId: addressId, 
            totalAmt: totalAmt, 
            userId: userId 
        });

        if (!totalAmt || !list_items || !addressId) {
            return res.status(400).json({
                message: 'Thiếu thông tin thanh toán',
                error: true
            });
        }

        if (!userId) {
            return res.status(401).json({
                message: 'Vui lòng đăng nhập để thanh toán',
                error: true
            });
        }

        // Đảm bảo totalAmt là số nguyên
        const amount = Math.round(totalAmt);

        const requestId = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
        const orderId = `ORDER_${requestId}`;
        const orderInfo = `Thanh toán đơn hàng ${orderId}`;
        
        // Tạo redirectUrl với orderId
        const redirectUrl = `${config.redirectUrl}?orderId=${orderId}`;

        const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=&ipnUrl=${config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;
        
        const signature = createMoMoSignature(rawSignature);

        const requestBody = {
            partnerCode: config.partnerCode,
            accessKey: config.accessKey,
            requestId: requestId,
            amount: amount.toString(),
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: config.ipnUrl,
            requestType: "captureWallet",
            extraData: "",
            lang: "vi",
            signature: signature
        };

        console.log('MoMo request body:', JSON.stringify(requestBody, null, 2));
        
        // Lưu thông tin đơn hàng tạm thời vào bộ nhớ (có thể sử dụng Redis cho production)
        global.pendingMomoOrders = global.pendingMomoOrders || {};
        global.pendingMomoOrders[orderId] = {
            userId,
            addressId,
            items: list_items,
            totalAmount: amount,
            createdAt: new Date()
        };

        try {
            const response = await axios.post(config.endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(JSON.stringify(requestBody))
                }
            });
            
            console.log('MoMo response:', JSON.stringify(response.data, null, 2));

            if (response.data.resultCode === 0) {
                // Không lưu đơn hàng vào database ở đây
                // Chỉ lưu khi nhận được webhook xác nhận thanh toán thành công
                
                return res.json({
                    success: true,
                    payUrl: response.data.payUrl
                });
            }

            return res.status(400).json({
                message: response.data.message || 'Không thể tạo thanh toán MoMo',
                error: true
            });
        } catch (axiosError) {
            console.error('Axios error:', axiosError.message);
            if (axiosError.response) {
                console.error('Response data:', JSON.stringify(axiosError.response.data, null, 2));
                console.error('Response status:', axiosError.response.status);
                return res.status(axiosError.response.status).json({
                    message: 'Lỗi khi gọi API MoMo: ' + (axiosError.response.data.message || axiosError.message),
                    error: true
                });
            } else if (axiosError.request) {
                console.error('No response received');
                return res.status(500).json({
                    message: 'Không nhận được phản hồi từ MoMo',
                    error: true
                });
            } else {
                return res.status(500).json({
                    message: 'Lỗi khi thiết lập yêu cầu: ' + axiosError.message,
                    error: true
                });
            }
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            message: 'Lỗi server khi tạo thanh toán MoMo: ' + error.message,
            error: true
        });
    }
};

export const handleMoMoWebhook = async (req, res) => {
    try {
        console.log('MoMo webhook received:', JSON.stringify(req.body, null, 2));
        const { 
            resultCode,
            orderId,
            amount,
            signature,
            extraData,
            transId
        } = req.body;

        console.log(`Processing webhook for order: ${orderId}, transId: ${transId}`);

        // Verify signature
        const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData || ""}&orderId=${orderId}&partnerCode=${config.partnerCode}&requestId=${orderId}`;
        const checkSignature = createMoMoSignature(rawSignature);

        console.log('Calculated signature:', checkSignature);
        console.log('Received signature:', signature);

        if (checkSignature !== signature) {
            console.error('Invalid signature');
            return res.status(400).json({ message: 'Chữ ký không hợp lệ' });
        }

        // Chỉ xử lý đơn hàng khi thanh toán thành công (resultCode = 0)
        if (resultCode === 0) {
            // Lấy thông tin đơn hàng từ bộ nhớ tạm
            global.pendingMomoOrders = global.pendingMomoOrders || {};
            const pendingOrder = global.pendingMomoOrders[orderId];
            
            if (!pendingOrder) {
                console.error('Pending order not found:', orderId);
                return res.status(400).json({ message: 'Đơn hàng không tồn tại' });
            }

            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Tạo đơn hàng chỉ khi thanh toán thành công
                const order = await OrderModel.create({
                    userId: pendingOrder.userId,
                    addressId: pendingOrder.addressId,
                    items: pendingOrder.items,
                    totalAmount: amount,
                    paymentMethod: 'MOMO',
                    paymentStatus: 'PAID',
                    orderId: orderId,
                    status: 'PROCESSING',
                    transactionId: transId
                });

                // Xóa giỏ hàng
                await UserModel.findByIdAndUpdate(
                    pendingOrder.userId,
                    { shopping_cart: [] },
                    { session }
                );

                await CartProductModel.deleteMany(
                    { userId: pendingOrder.userId },
                    { session }
                );

                // Xóa đơn hàng tạm khỏi bộ nhớ
                delete global.pendingMomoOrders[orderId];

                await session.commitTransaction();
                console.log('Order payment completed and saved:', orderId);
                
                return res.json({ success: true });
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                await session.endSession();
            }
        } else {
            console.error('Payment failed with code:', resultCode);
            
            // Xóa đơn hàng tạm khỏi bộ nhớ nếu thanh toán thất bại
            global.pendingMomoOrders = global.pendingMomoOrders || {};
            delete global.pendingMomoOrders[orderId];
            
            return res.status(400).json({ message: 'Thanh toán thất bại' });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ message: 'Lỗi xử lý webhook' });
    }
}; 