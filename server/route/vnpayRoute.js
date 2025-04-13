import { createVnpayPaymentUrl, vnpayReturn } from "../controllers/vnpayController.js"  
import express from "express"  

const router = express.Router()  

router.post("/create_payment_url", createVnpayPaymentUrl)  
router.get("/vnpay_return", vnpayReturn)  

export default router  