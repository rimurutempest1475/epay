import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import orderRoutes from './route/order.route.js';
import momoRoutes from './route/momo.route.js';
import cryptoPaymentRoutes from './route/cryptoPayment.route.js';
import vnpayRoutes from './route/vnpay.route.js';
// ... other imports

const app = express();
dotenv.config();

// Middleware
const corsOptions = {
  origin: [process.env.FRONTEND_URL, 'https://epay-client.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/order', orderRoutes);
app.use('/api/momo', momoRoutes);
app.use('/api/crypto', cryptoPaymentRoutes);
app.use('/api/vnpay', vnpayRoutes);
// ... other routes

export default app; 