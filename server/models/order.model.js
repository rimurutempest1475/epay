import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.ObjectId,
        ref : 'User'
    },
    orderId : {
        type : String,
        default: function() {
            return `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
    },
    list_items: [{
        productId: {
            type: mongoose.Schema.ObjectId,
            ref: 'product'
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    paymentMethod: {
        type: String,
        enum: ['cash', 'stripe', 'momo', 'crypto', 'vnpay'],
        default: 'cash'
    },
    product_details : {
        name : String,
        image : Array,
    },
    paymentId : {
        type : String,
        default : ""
    },
    payment_status : {
        type : String,
        default : ""
    },
    delivery_address : {
        type : mongoose.Schema.ObjectId,
        ref : 'address'
    },
    subTotalAmt : {
        type : Number,
        default : 0
    },
    totalAmt : {
        type : Number,
        default : 0
    },
    invoice_receipt : {
        type : String,
        default : ""
    },
    transactionId: {
        type: String,
        default: null
    }
},{
    timestamps : true
})

const OrderModel = mongoose.model('order',orderSchema)

export default OrderModel