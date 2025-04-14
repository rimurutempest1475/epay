import crypto from 'crypto';
import moment from 'moment';
import dotenv from 'dotenv';
import OrderModel from '../models/order.model.js';
import querystring from 'querystring';

dotenv.config();

// Sắp xếp object theo key để chuẩn bị tạo chuỗi query
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

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

        // Cấu hình VNPay
        const tmnCode = process.env.VNPAY_TMN_CODE;
        const secretKey = process.env.VNPAY_HASH_SECRET;
        const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        const returnUrl = process.env.NODE_ENV === 'production'
            ? 'https://epay-client.onrender.com/order/success'
            : 'http://localhost:5173/order/success';

        // Định dạng thời gian chính xác
        const date = new Date();
        const createDate = date.getFullYear().toString() +
                          (date.getMonth() + 1).toString().padStart(2, '0') +
                          date.getDate().toString().padStart(2, '0') +
                          date.getHours().toString().padStart(2, '0') +
                          date.getMinutes().toString().padStart(2, '0') +
                          date.getSeconds().toString().padStart(2, '0');
        
        const orderId = createDate + '_' + Math.floor(Math.random() * 1000000);
        
        // Xử lý IP chính xác
        let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        
        if (ipAddr && (ipAddr === '::1' || ipAddr.includes('::ffff:'))) {
            ipAddr = '127.0.0.1';
        }
        
        console.log('Client IP:', ipAddr);
        
        // Xử lý số tiền chính xác theo VNPay (số nguyên, không có dấu phẩy, đơn vị VND)
        const amount = Math.round(parseFloat(totalAmt) * 100);
        
        console.log('Tổng tiền thanh toán:', amount);
        
        // Tạo đối tượng tham số
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh_toan_don_hang_' + orderId;
        vnp_Params['vnp_OrderType'] = 'billpayment';
        vnp_Params['vnp_Amount'] = amount;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        
        console.log('VNP Params trước khi sắp xếp:', JSON.stringify(vnp_Params, null, 2));
        
        // Sắp xếp theo đúng thuật toán của VNPay
        vnp_Params = sortObject(vnp_Params);
        
        console.log('VNP Params sau khi sắp xếp:', JSON.stringify(vnp_Params, null, 2));
        
        // Tạo chuỗi ký
        let signData = "";
        for (let key in vnp_Params) {
            if (signData) signData += '&' + key + '=' + vnp_Params[key];
            else signData = key + '=' + vnp_Params[key];
        }
        
        console.log('Sign data (raw):', signData);
        
        // Tạo chữ ký
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");
        
        console.log('Hash Secret:', secretKey);
        console.log('Secure Hash:', signed);
        
        // Thêm chữ ký vào tham số
        vnp_Params['vnp_SecureHash'] = signed;
        
        // Tạo URL thanh toán
        let querystring = "";
        for (let key in vnp_Params) {
            if (querystring) querystring += '&' + key + '=' + vnp_Params[key];
            else querystring = key + '=' + vnp_Params[key];
        }
        
        const paymentUrl = vnpUrl + "?" + querystring;
        
        console.log('Payment URL:', paymentUrl);
        
        // Lưu thông tin đơn hàng
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
            paymentUrl: paymentUrl
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
        const returnUrl = process.env.NODE_ENV === 'production'
            ? 'https://epay-client.onrender.com/order/success'
            : 'http://localhost:5173/order/success';
        const secretKey = process.env.VNPAY_HASH_SECRET;
        
        console.log('VNPay callback received:', req.query);
        
        // Lấy tham số từ URL
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];
        
        // Xóa chữ ký để tạo lại
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];
        
        // Sắp xếp tham số theo thứ tự
        vnp_Params = sortObject(vnp_Params);
        
        console.log('VNPay callback params sau khi sắp xếp:', JSON.stringify(vnp_Params, null, 2));
        
        // Tạo chuỗi ký
        let signData = "";
        for (let key in vnp_Params) {
            if (signData) signData += '&' + key + '=' + vnp_Params[key];
            else signData = key + '=' + vnp_Params[key];
        }
        
        console.log('Callback sign data:', signData);
        
        // Tạo chữ ký để kiểm tra
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");
        
        console.log('Original hash:', secureHash);
        console.log('Calculated hash:', signed);
        
        // So sánh chữ ký
        if (secureHash === signed) {
            const orderId = vnp_Params['vnp_TxnRef'];
            const rspCode = vnp_Params['vnp_ResponseCode'];
            
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
                        orderStatus: 'processing',
                        transactionId: vnp_Params['vnp_TransactionNo']
                    });
                    
                    await order.save();
                    delete global.pendingVNPayOrders[orderId];
                }
                
                return res.redirect(`${returnUrl}?status=success`);
            } else {
                // Thanh toán thất bại
                console.log('Payment failed with code:', rspCode);
                return res.redirect(`${returnUrl}?status=fail`);
            }
        } else {
            // Chữ ký không hợp lệ
            console.log('Invalid signature in callback');
            return res.redirect(`${returnUrl}?status=fail&error=invalid_signature`);
        }
    } catch (error) {
        console.error('VNPay callback error:', error);
        return res.redirect(`${returnUrl}?status=fail&error=server_error`);
    }
}; 