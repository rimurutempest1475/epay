import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { useGlobalContext } from '../provider/GlobalProvider';

const OrderSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const { fetchCartItem, fetchOrder } = useGlobalContext();

    useEffect(() => {
        const checkOrderStatus = async () => {
            try {
                // Lấy orderId từ URL search params (từ MoMo redirect)
                const searchParams = new URLSearchParams(location.search);
                const orderId = searchParams.get('orderId');
                const resultCode = searchParams.get('resultCode');

                if (resultCode === '1006' || resultCode === '1005' || resultCode === '1003') {
                    // Người dùng hủy thanh toán hoặc thanh toán thất bại
                    setPaymentStatus('failed');
                    toast.error('Thanh toán đã bị hủy hoặc thất bại');
                    setTimeout(() => {
                        navigate('/checkout');
                    }, 3000);
                    return;
                }

                if (orderId) {
                    // Kiểm tra trạng thái đơn hàng từ server
                    const response = await Axios({
                        ...SummaryApi.check_order_status,
                        params: { orderId }
                    });

                    if (response.data.paymentStatus === 'PAID') {
                        setPaymentStatus('success');
                        toast.success('Thanh toán thành công!');
                        
                        // Cập nhật giỏ hàng và đơn hàng
                        if(fetchCartItem) fetchCartItem();
                        if(fetchOrder) fetchOrder();
                        
                        setTimeout(() => {
                            navigate('/');
                        }, 3000);
                    } else {
                        setPaymentStatus('failed');
                        toast.error('Thanh toán thất bại hoặc đã bị hủy');
                        setTimeout(() => {
                            navigate('/checkout');
                        }, 3000);
                    }
                } else {
                    // Không có orderId, đơn hàng không hợp lệ
                    setPaymentStatus('invalid');
                    toast.error('Thông tin đơn hàng không hợp lệ');
                    setTimeout(() => {
                        navigate('/checkout');
                    }, 3000);
                }
            } catch (error) {
                console.error('Error checking order status:', error);
                setPaymentStatus('error');
                toast.error('Lỗi khi kiểm tra trạng thái đơn hàng');
                setTimeout(() => {
                    navigate('/checkout');
                }, 3000);
            } finally {
                setLoading(false);
            }
        };

        checkOrderStatus();
    }, [navigate, location, fetchCartItem, fetchOrder]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Đang kiểm tra trạng thái thanh toán...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {paymentStatus === 'success' && (
                <>
                    <h1 className="text-3xl font-bold text-green-600 mb-4">Thanh toán thành công!</h1>
                    <p className="text-gray-600">Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.</p>
                    <p className="text-gray-500 mt-2">Bạn sẽ được chuyển về trang chủ sau 3 giây...</p>
                </>
            )}
            
            {paymentStatus === 'failed' && (
                <>
                    <h1 className="text-3xl font-bold text-red-600 mb-4">Thanh toán thất bại!</h1>
                    <p className="text-gray-600">Thanh toán của bạn đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý.</p>
                    <p className="text-gray-500 mt-2">Bạn sẽ được chuyển về trang thanh toán sau 3 giây...</p>
                </>
            )}
            
            {paymentStatus === 'invalid' && (
                <>
                    <h1 className="text-3xl font-bold text-yellow-600 mb-4">Thông tin không hợp lệ!</h1>
                    <p className="text-gray-600">Thông tin đơn hàng không hợp lệ hoặc không tìm thấy.</p>
                    <p className="text-gray-500 mt-2">Bạn sẽ được chuyển về trang thanh toán sau 3 giây...</p>
                </>
            )}
            
            {paymentStatus === 'error' && (
                <>
                    <h1 className="text-3xl font-bold text-yellow-600 mb-4">Lỗi hệ thống!</h1>
                    <p className="text-gray-600">Đã xảy ra lỗi khi kiểm tra trạng thái thanh toán.</p>
                    <p className="text-gray-500 mt-2">Bạn sẽ được chuyển về trang thanh toán sau 3 giây...</p>
                </>
            )}
        </div>
    );
};

export default OrderSuccess; 