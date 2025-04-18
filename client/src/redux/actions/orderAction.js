import instance from '../../utils/Axios';
import {
    CREATE_ORDER_REQUEST,
    CREATE_ORDER_SUCCESS,
    CREATE_ORDER_FAIL,
} from '../constants/orderConstant';
import { toast } from 'react-hot-toast';

export const createOrder = (orderData) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_ORDER_REQUEST });

        const { data } = await instance.post("/api/order/create", orderData);

        dispatch({
            type: CREATE_ORDER_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: CREATE_ORDER_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const createStripePayment = (orderData) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_ORDER_REQUEST });

        const { data } = await instance.post("/api/order/create-stripe-session", orderData);

        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error('No payment URL received from Stripe');
        }

        dispatch({
            type: CREATE_ORDER_SUCCESS,
            payload: data,
        });
    } catch (error) {
        console.error('Stripe payment error:', error);
        dispatch({
            type: CREATE_ORDER_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const createMomoPayment = (orderData) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_ORDER_REQUEST });

        const { data } = await instance.post("/api/momo/create-momo-payment", orderData);

        if (data.payUrl) {
            window.location.href = data.payUrl;
        }

        dispatch({
            type: CREATE_ORDER_SUCCESS,
            payload: data,
        });
    } catch (error) {
        console.error('MoMo payment error:', error);
        dispatch({
            type: CREATE_ORDER_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const createVNPayPayment = (orderData) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_ORDER_REQUEST });

        const { data } = await instance.post("/api/vnpay/create-payment", {
            list_items: orderData.list_items,
            addressId: orderData.addressId,
            totalAmt: orderData.totalAmt
        });

        if (data.paymentUrl) {
            window.location.href = data.paymentUrl;
        } else {
            throw new Error('No payment URL received from VNPay');
        }

        dispatch({
            type: CREATE_ORDER_SUCCESS,
            payload: orderData,
        });
    } catch (error) {
        console.error('VNPay payment error:', error);
        dispatch({
            type: CREATE_ORDER_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const createCryptoPayment = (orderData) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_ORDER_REQUEST });

        console.log('Creating crypto payment:', orderData);

        // Format data
        const requestData = {
            list_items: Array.isArray(orderData.list_items) 
                ? orderData.list_items.map(item => ({
                    productId: item.productId?._id || item.productId,
                    quantity: item.quantity,
                    price: item.price || item.productId?.price
                  }))
                : [],
            addressId: orderData.addressId,
            totalAmt: orderData.totalAmt || orderData.subTotalAmt
        };

        console.log('Sending request with data:', requestData);

        const response = await instance.post("/api/crypto/create-charge", requestData);

        console.log('Crypto payment response:', response.data);

        if (response.data.success && response.data.data.data.hosted_url) {
            window.location.href = response.data.data.data.hosted_url;
        } else {
            throw new Error('No hosted_url received from Coinbase');
        }

        dispatch({
            type: CREATE_ORDER_SUCCESS,
            payload: response.data
        });
    } catch (error) {
        console.error('Crypto payment error:', error);
        toast.error('Payment failed: ' + (error.response?.data?.error || error.message));
        dispatch({
            type: CREATE_ORDER_FAIL,
            payload: error.response?.data?.message || error.message
        });
    }
}; 