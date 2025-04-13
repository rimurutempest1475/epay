import crypto from 'crypto';
import querystring from 'querystring';
import dotenv from 'dotenv';
import OrderModel from '../models/order.model.js';

dotenv.config();

const config = {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    vnpUrl: process.env.VNPAY_URL,
    returnUrl: process.env.NODE_ENV === 'production'
        ? 'https://epay-client.onrender.com/order/success'
        : 'http://localhost:5173/order/success'
};

const sortObject = (obj) => {
    const sorted = {};
    const str = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (let key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
};

export const createVNPayPayment = async (req, res) => {
    try {
        const { list_items, addressId, totalAmt } = req.body;
        const userId = req.userId;

        if (!totalAmt || !list_items || !addressId) {
            return res.status(400).json({
                message: 'Thiếu thông tin thanh toán',
                error: true
            });
        }

        const amount = Math.round(totalAmt * 100); // Convert to smallest currency unit
        const date = new Date();
        const createDate = date.toISOString().split('T')[0].split('-').join('');
        const orderId = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

        const vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: config.tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
            vnp_OrderType: 'other',
            vnp_Amount: amount,
            vnp_ReturnUrl: config.returnUrl,
            vnp_IpAddr: req.ip,
            vnp_CreateDate: createDate
        };

        const sortedParams = sortObject(vnpParams);
        const signData = querystring.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac('sha512', config.hashSecret);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest('hex');
        vnpParams.vnp_SecureHash = signed;

        const vnpUrl = `${config.vnpUrl}?${querystring.stringify(vnpParams, { encode: false })}`;

        // Lưu thông tin đơn hàng tạm thời
        global.pendingVNPayOrders = global.pendingVNPayOrders || {};
        global.pendingVNPayOrders[orderId] = {
            userId,
            addressId,
            items: list_items,
            totalAmount: totalAmt,
            createdAt: new Date()
        };

        return res.json({
            success: true,
            paymentUrl: vnpUrl
        });
    } catch (error) {
        console.error('VNPay payment error:', error);
        return res.status(500).json({
            message: 'Lỗi khi tạo thanh toán VNPay: ' + error.message,
            error: true
        });
    }
};

export const handleVNPayCallback = async (req, res) => {
    try {
        const vnpParams = req.query;
        const secureHash = vnpParams.vnp_SecureHash;

        delete vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHashType;

        const sortedParams = sortObject(vnpParams);
        const signData = querystring.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac('sha512', config.hashSecret);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            const orderId = vnpParams.vnp_TxnRef;
            const rspCode = vnpParams.vnp_ResponseCode;

            if (rspCode === '00') {
                // Thanh toán thành công
                const pendingOrder = global.pendingVNPayOrders[orderId];
                if (pendingOrder) {
                    const order = new OrderModel({
                        userId: pendingOrder.userId,
                        addressId: pendingOrder.addressId,
                        items: pendingOrder.items,
                        totalAmount: pendingOrder.totalAmount,
                        paymentMethod: 'vnpay',
                        paymentStatus: 'paid',
                        orderStatus: 'processing'
                    });

                    await order.save();
                    delete global.pendingVNPayOrders[orderId];
                }

                res.redirect(`${config.returnUrl}?status=success`);
            } else {
                // Thanh toán thất bại
                res.redirect(`${config.returnUrl}?status=fail`);
            }
        } else {
            res.status(400).json({ message: 'Chữ ký không hợp lệ' });
        }
    } catch (error) {
        console.error('VNPay callback error:', error);
        res.status(500).json({
            message: 'Lỗi khi xử lý callback VNPay: ' + error.message,
            error: true
        });
    }
}; 