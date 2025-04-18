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

        const requestData = {
            list_items: orderData.list_items,
            addressId: orderData.addressId,
            totalAmt: orderData.totalAmt || orderData.subTotalAmt
        };

        const response = await instance.post("/api/crypto/create-charge", requestData);

        console.log('Crypto payment response:', response.data);

        // Hiển thị thông tin chuyển đổi tiền tệ (sửa từ toast.info thành toast)
        if (response.data.conversionRate) {
            // Sử dụng toast() thay vì toast.info() vì react-hot-toast không có phương thức info
            toast(`Chuyển đổi: ${response.data.conversionRate.vnd.toLocaleString('vi-VN')} VND = ${response.data.conversionRate.usd} USD`, {
                duration: 5000,
                // Tùy chỉnh style để giống toast info
                style: {
                    background: '#3498db',
                    color: 'white',
                }
            });
        }

        if (response.data.success && response.data.data.data?.hosted_url) {
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
        toast.error(error.response?.data?.error || 'Payment creation failed');
        dispatch({
            type: CREATE_ORDER_FAIL,
            payload: error.response?.data?.message || error.message
        });
    }
};