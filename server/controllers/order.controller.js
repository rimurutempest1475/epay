import Stripe from "../config/stripe.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";

export async function CashOnDeliveryOrderController(request,response){
    try {
        const userId = request.userId // auth middleware 
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body 

        const payload = list_items.map(el => {
            return({
                userId : userId,
                orderId : `ORD-${new mongoose.Types.ObjectId()}`,
                productId : el.productId._id, 
                product_details : {
                    name : el.productId.name,
                    image : el.productId.image
                },
                paymentId : "",
                paymentMethod: "CASH ON DELIVERY",
                payment_status : "PENDING",
                status: "PROCESSING", // Đơn hàng COD mặc định là PROCESSING
                delivery_address : addressId,
                subTotalAmt  : subTotalAmt,
                totalAmt  :  totalAmt,
            })
        })

        const generatedOrder = await OrderModel.insertMany(payload)

        ///remove from the cart
        const removeCartItems = await CartProductModel.deleteMany({ userId : userId })
        const updateInUser = await UserModel.updateOne({ _id : userId }, { shopping_cart : []})

        return response.json({
            message : "Order successfully",
            error : false,
            success : true,
            data : generatedOrder
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const pricewithDiscount = (price, discountPercentage = 0) => {  
    const priceNumber = Number(price);  
    const discountNumber = Number(discountPercentage);  

    const discountAmount = (priceNumber * discountNumber) / 100;  
    const actualPrice = priceNumber - discountAmount;  

    console.log(`Giá gốc: ${priceNumber} VNĐ, Giảm giá: ${discountNumber}%, Số tiền giảm: ${discountAmount} VNĐ, Giá thực tế: ${actualPrice} VNĐ`);  

    return Math.max(actualPrice, 0);  
};  

export async function paymentController(request,response){
    try {
        const userId = request.userId // auth middleware 
        const { list_items, totalAmt, addressId,subTotalAmt } = request.body 

        const user = await UserModel.findById(userId)

        const line_items  = list_items.map(item =>{
            return{
               price_data : {
                    currency : 'vnd',
                    product_data : {
                        name : item.productId.name,
                        images : item.productId.image,
                        metadata : {
                            productId : item.productId._id
                        }
                    },
                    unit_amount : pricewithDiscount(item.productId.price,item.productId.discount)// * 100   
               },
               adjustable_quantity : {
                    enabled : true,
                    minimum : 1
               },
               quantity : item.quantity 
            }
        })

        const params = {
            submit_type : 'pay',
            mode : 'payment',
            payment_method_types : ['card'],
            customer_email : user.email,
            metadata : {
                userId : userId,
                addressId : addressId
            },
            line_items : line_items,
            success_url : `${process.env.FRONTEND_URL}/success`,
            cancel_url : `${process.env.FRONTEND_URL}/cancel`
        }

        const session = await Stripe.checkout.sessions.create(params)

        return response.status(200).json(session)

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}


const getOrderProductItems = async({
    lineItems,
    userId,
    addressId,
    paymentId,
    payment_status,
 })=>{
    const productList = []

    if(lineItems?.data?.length){
        for(const item of lineItems.data){
            const product = await Stripe.products.retrieve(item.price.product)

            const paylod = {
                userId : userId,
                orderId : `ORD-${new mongoose.Types.ObjectId()}`,
                productId : product.metadata.productId, 
                product_details : {
                    name : product.name,
                    image : product.images
                } ,
                paymentId : paymentId,
                payment_status : payment_status,
                delivery_address : addressId,
                subTotalAmt  : Number(item.amount_total / 100),
                totalAmt  :  Number(item.amount_total / 100),
            }

            productList.push(paylod)
        }
    }

    return productList
}

//http://localhost:8080/api/order/webhook
export async function webhookStripe(request, response) {
    try {
        console.log('Webhook received:', request.headers['stripe-signature']);
        const sig = request.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_ENDPOINT_WEBHOOK_SECRET_KEY;
        
        console.log('Webhook secret:', endpointSecret ? 'Present' : 'Missing');
        
        let event;
        try {
            event = Stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
            console.log('Event constructed successfully:', event.type);
        } catch (err) {
            console.error(`Webhook signature verification failed:`, err.message);
            return response.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                try {
                    console.log('Processing checkout.session.completed event');
                    const checkoutSession = event.data.object;
                    console.log('Payment status:', checkoutSession.payment_status);
                    
                    // Verify payment status - chỉ lưu đơn hàng khi thanh toán thành công
                    if (checkoutSession.payment_status !== 'paid') {
                        console.log('Payment not completed, not creating order');
                        return response.json({ received: true });
                    }

                    const lineItems = await Stripe.checkout.sessions.listLineItems(checkoutSession.id);
                    console.log('Line items retrieved:', lineItems.data.length);
                    const userId = checkoutSession.metadata.userId;
                    console.log('Processing order for user:', userId);

                    // Get order details
                    const orderProduct = await getOrderProductItems({
                        lineItems: lineItems,
                        userId: userId,
                        addressId: checkoutSession.metadata.addressId,
                        paymentId: checkoutSession.payment_intent,
                        payment_status: 'PAID'
                    });
                    console.log('Order products prepared:', orderProduct.length);

                    // Create order with transaction
                    const dbSession = await mongoose.startSession();
                    dbSession.startTransaction();

                    try {
                        // Insert order
                        const order = await OrderModel.insertMany(orderProduct, { session: dbSession });
                        console.log('Order created:', order[0]?.orderId);

                        if (!order || !order[0]) {
                            throw new Error('Failed to create order');
                        }

                        // Update user cart
                        await UserModel.findByIdAndUpdate(
                            userId,
                            { shopping_cart: [] },
                            { session: dbSession }
                        );
                        console.log('User cart cleared');

                        // Clear cart products
                        await CartProductModel.deleteMany(
                            { userId: userId },
                            { session: dbSession }
                        );
                        console.log('Cart products cleared');

                        // Commit transaction
                        await dbSession.commitTransaction();
                        console.log('Transaction committed successfully');
                    } catch (error) {
                        console.error('Transaction failed:', error);
                        await dbSession.abortTransaction();
                        throw error;
                    } finally {
                        await dbSession.endSession();
                    }
                } catch (error) {
                    console.error('Error processing order:', error);
                }
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return response.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return response.status(500).json({
            message: 'Internal server error',
            error: true,
            success: false
        });
    }
}


export async function getOrderDetailsController(request,response){
    try {
        const userId = request.userId // order id

        const orderlist = await OrderModel.find({ userId : userId }).sort({ createdAt : -1 }).populate('delivery_address')

        return response.json({
            message : "order list",
            data : orderlist,
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getOrderStatusController = async (req, res) => {
    try {
        const { orderId } = req.query;
        
        if (!orderId) {
            return res.status(400).json({
                message: 'Thiếu orderId',
                error: true
            });
        }
        
        const order = await OrderModel.findOne({ orderId });
        
        if (!order) {
            return res.status(404).json({
                message: 'Không tìm thấy đơn hàng',
                error: true
            });
        }
        
        return res.json({
            orderId: order.orderId,
            paymentStatus: order.paymentStatus || order.payment_status,
            status: order.status
        });
    } catch (error) {
        console.error('Error checking order status:', error);
        return res.status(500).json({
            message: 'Lỗi server khi kiểm tra trạng thái đơn hàng',
            error: true
        });
    }
};
