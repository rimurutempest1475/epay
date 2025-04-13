import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { createOrder, createStripePayment, createMomoPayment, createCryptoPayment } from "../redux/actions/orderAction";
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
    const [totalAmount, setTotalAmount] = useState(0);
    const [user, setUser] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [cartItems, setCartItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch user data
        axios.get('/api/user/me')
            .then(response => {
                setUser(response.data);
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
            });

        // Fetch cart items
        axios.get('/api/cart/items')
            .then(response => {
                setCartItems(response.data);
            })
            .catch(error => {
                console.error('Error fetching cart items:', error);
            });
    }, []);

    const handleStripePayment = async () => {
        // Implementation of handleStripePayment
    };

    const handleMoMoPayment = async () => {
        try {
            const response = await axios.post('/api/order/create-momo-payment', {
                amount: totalAmount,
                orderInfo: `Payment for order ${Date.now()}`,
                userId: user._id,
                addressId: selectedAddress,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                }))
            });

            if (response.data.payUrl) {
                window.location.href = response.data.payUrl;
            }
        } catch (error) {
            console.error('MoMo payment error:', error);
            toast.error('Failed to create MoMo payment');
        }
    };

    const handleCryptoPayment = async () => {
        try {
            const orderData = {
                ...formData,
                paymentMethod,
                paymentStatus: "pending",
                orderStatus: "pending",
                totalPrice: totalAmount,
                cartItems: cartItems,
            };
            dispatch(createCryptoPayment(orderData));
            navigate("/order-success");
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Payment failed. Please try again.");
        }
    };

    const handlePayment = async () => {
        try {
            if (paymentMethod === "cash") {
                const orderData = {
                    ...formData,
                    paymentMethod,
                    paymentStatus: "pending",
                    orderStatus: "pending",
                    totalPrice: totalAmount,
                    cartItems: cartItems,
                };
                dispatch(createOrder(orderData));
                navigate("/order-success");
            } else if (paymentMethod === "stripe") {
                const orderData = {
                    ...formData,
                    paymentMethod,
                    paymentStatus: "pending",
                    orderStatus: "pending",
                    totalPrice: totalAmount,
                    cartItems: cartItems,
                };
                dispatch(createStripePayment(orderData));
            } else if (paymentMethod === "momo") {
                const orderData = {
                    ...formData,
                    paymentMethod,
                    paymentStatus: "pending",
                    orderStatus: "pending",
                    totalPrice: totalAmount,
                    cartItems: cartItems,
                };
                dispatch(createMomoPayment(orderData));
            } else if (paymentMethod === "crypto") {
                const orderData = {
                    ...formData,
                    paymentMethod,
                    paymentStatus: "pending",
                    orderStatus: "pending",
                    totalPrice: totalAmount,
                    cartItems: cartItems,
                };
                dispatch(createCryptoPayment(orderData));
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Payment failed. Please try again.");
        }
    };

    return (
        <div className="checkout-container">
            {/* ... existing checkout form ... */}
            
            <div className="payment-methods">
                <button 
                    onClick={handleStripePayment}
                    className="payment-button stripe-button"
                >
                    Pay with Stripe
                </button>
                
                <button 
                    onClick={handleMoMoPayment}
                    className="payment-button momo-button"
                >
                    Pay with MoMo
                </button>
            </div>
            
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <input
                        type="radio"
                        name="payment"
                        id="crypto"
                        value="crypto"
                        checked={paymentMethod === "crypto"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-2"
                    />
                    <label htmlFor="crypto" className="text-gray-700">
                        Cryptocurrency (Bitcoin, Ethereum, etc.)
                    </label>
                </div>
            </div>
            
            {/* ... rest of the component ... */}
        </div>
    );
};

export default Checkout; 