import express from 'express';
import { createMoMoPayment, handleMoMoWebhook } from '../controllers/momo.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Route tạo thanh toán MoMo
router.post('/create-momo-payment', auth, createMoMoPayment);

// Route webhook MoMo
router.post('/momo-webhook', handleMoMoWebhook);

export default router; 