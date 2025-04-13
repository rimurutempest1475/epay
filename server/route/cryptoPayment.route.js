import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import Order from '../models/order.js';

const router = express.Router();

const COINBASE_API_KEY = 'ccd88b78-9149-482f-a8a1-cc657503a242';
const COINBASE_WEBHOOK_SECRET = 'OD0Wv1J32qzAUI6+crb4slya4TcLHI9yhZ5IeGslcQL3M5z9VHQihrBqEwirhzazsDR3l6vdZOpGO0CGl/tZYg==';

// Create a new charge
router.post('/create-charge', async (req, res) => {
    try {
        const { list_items, addressId, totalAmt } = req.body;

        // Create order in database first
        const order = new Order({
            list_items,
            addressId,
            totalAmt,
            paymentMethod: 'crypto',
            paymentStatus: 'pending',
            orderStatus: 'pending'
        });

        await order.save();

        // Create Coinbase Commerce charge
        const response = await axios.post('https://api.commerce.coinbase.com/charges', {
            name: `Order #${order._id}`,
            description: `Payment for order #${order._id}`,
            pricing_type: 'fixed_price',
            local_price: {
                amount: totalAmt.toString(),
                currency: 'USD'
            },
            metadata: {
                orderId: order._id
            }
        }, {
            headers: {
                'X-CC-Api-Key': COINBASE_API_KEY,
                'X-CC-Version': '2018-03-22'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error creating charge:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to create charge' });
    }
});

// Webhook handler
router.post('/webhook', async (req, res) => {
    const signature = req.headers['x-cc-webhook-signature'];
    const payload = req.body;

    // Verify webhook signature
    const hmac = crypto.createHmac('sha256', COINBASE_WEBHOOK_SECRET);
    const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');

    if (signature !== calculatedSignature) {
        return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle different event types
    const event = payload.event;
    const orderId = payload.data.metadata.orderId;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        switch (event.type) {
            case 'charge:confirmed':
                order.paymentStatus = 'paid';
                order.orderStatus = 'processing';
                await order.save();
                break;
            case 'charge:failed':
                order.paymentStatus = 'failed';
                order.orderStatus = 'cancelled';
                await order.save();
                break;
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

export default router; 