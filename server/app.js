import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import orderRoutes from './route/order.route.js';
import momoRoutes from './route/momo.route.js';
import cryptoPaymentRoutes from './route/cryptoPayment.route.js';
// ... other imports

const app = express();
dotenv.config();

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://epay-client.onrender.com'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/order', orderRoutes);
app.use('/api/momo', momoRoutes);
app.use('/api/crypto', cryptoPaymentRoutes);
// ... other routes

export default app; 