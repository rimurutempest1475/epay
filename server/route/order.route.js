import { Router } from 'express'
import auth from '../middleware/auth.js'
import { CashOnDeliveryOrderController, getOrderDetailsController, paymentController, webhookStripe, getOrderStatusController } from '../controllers/order.controller.js'
import { createMoMoPayment, handleMoMoWebhook } from '../controllers/momo.controller.js';
const orderRouter = Router()

orderRouter.post("/cash-on-delivery",auth,CashOnDeliveryOrderController)
orderRouter.post('/checkout',auth,paymentController)
orderRouter.post('/webhook',webhookStripe)
orderRouter.get("/order-list",auth,getOrderDetailsController)
orderRouter.post('/create-momo-payment',auth,createMoMoPayment)
orderRouter.post('/momo-webhook',handleMoMoWebhook)
orderRouter.get('/check-status', getOrderStatusController)

export default orderRouter