import express from 'express';
import { createVNPayPayment, handleVNPayCallback } from '../controllers/vnpay.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Route tạo thanh toán VNPay
router.post('/create-payment', auth, createVNPayPayment);

// Route callback VNPay
router.get('/vnpay-return', handleVNPayCallback);

export default router; 