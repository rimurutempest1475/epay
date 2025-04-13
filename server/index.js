import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
import connectDB from './config/connectDB.js'
import userRouter from './route/user.route.js'
import categoryRouter from './route/category.route.js'
import uploadRouter from './route/upload.router.js'
import subCategoryRouter from './route/subCategory.route.js'
import productRouter from './route/product.route.js'
import cartRouter from './route/cart.route.js'
import addressRouter from './route/address.route.js'
import orderRouter from './route/order.route.js'
import momoRouter from './route/momo.route.js'
import vnpayRoute from "./route/vnpayRoute.js"

dotenv.config()
const app = express()

// Middleware
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

// Stripe webhook middleware - phải đặt trước middleware express.json()
app.post('/api/order/webhook', express.raw({type: 'application/json'}));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(helmet({
    crossOriginResourcePolicy: false
}))

// Routes
app.use('/api/user', userRouter)
app.use('/api/category', categoryRouter)
app.use('/api/file', uploadRouter)
app.use('/api/subcategory', subCategoryRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/address', addressRouter)
app.use('/api/order', orderRouter)
app.use('/api/momo', momoRouter)
app.use('/api/vnpay', vnpayRoute)

const PORT = process.env.PORT || 8080

app.get('/', (req, res) => {
    res.json({
        message: "Server is running on port " + PORT
    })
})

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is running on port", PORT)
    })
})

