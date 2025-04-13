import axios from 'axios';
import {
    CREATE_ORDER_REQUEST,
    CREATE_ORDER_SUCCESS,
    CREATE_ORDER_FAIL,
} from '../constants/orderConstant';

export const createOrder = (orderData) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_ORDER_REQUEST });

        const { data } = await axios.post("/api/order/create", orderData);

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

        const { data } = await axios.post("/api/order/create-stripe-session", orderData);

        window.location.href = data.url;

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

export const createMomoPayment = (orderData) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_ORDER_REQUEST });

        const { data } = await axios.post("/api/momo/create", orderData);

        if (data.payUrl) {
            window.location.href = data.payUrl;
        }

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

export const createCryptoPayment = (orderData) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_ORDER_REQUEST });

        const { data } = await axios.post("/api/crypto/create-charge", {
            list_items: orderData.list_items,
            addressId: orderData.addressId,
            totalAmt: orderData.totalAmt
        });

        // Redirect to Coinbase Commerce payment page
        if (data.data && data.data.hosted_url) {
            window.location.href = data.data.hosted_url;
        } else {
            throw new Error('No hosted_url received from Coinbase');
        }

        dispatch({
            type: CREATE_ORDER_SUCCESS,
            payload: orderData,
        });
    } catch (error) {
        dispatch({
            type: CREATE_ORDER_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
}; 