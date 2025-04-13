import React from 'react'
import { useSelector } from 'react-redux'
import NoData from '../components/NoData'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'

const MyOrders = () => {
  const allOrders = useSelector(state => state.orders.order)
  
  // Hàm xác định phương thức thanh toán từ thông tin đơn hàng
  const getPaymentMethodName = (order) => {
    if (order.paymentMethod === "CASH ON DELIVERY" || order.payment_status === "CASH ON DELIVERY") {
      return 'Thanh toán khi nhận hàng';
    } else if (order.paymentId && order.paymentId.startsWith('pi_')) {
      return 'Stripe';
    } else if (order.transactionId) {
      return 'MoMo';
    } else {
      return 'Không xác định';
    }
  };
  
  // Lọc các đơn hàng hợp lệ (không hiển thị đơn thất bại hoặc chưa hoàn thành thanh toán)
  const orders = allOrders.filter(order => {
    const paymentStatus = order.paymentStatus || order.payment_status;
    const paymentMethod = getPaymentMethodName(order);
    
    // Hiển thị tất cả đơn hàng COD
    if (paymentMethod === 'Thanh toán khi nhận hàng' || order.paymentMethod === "CASH ON DELIVERY" || order.payment_status === "CASH ON DELIVERY") {
      return true;
    }
    
    // Các trường hợp thanh toán online
    // Chỉ hiển thị các đơn có trạng thái PAID hoặc các đơn PENDING nhưng không bị CANCELLED
    if (paymentStatus === 'PAID' || (paymentStatus === 'PENDING' && order.status !== 'CANCELLED')) {
      return true;
    }
    
    return false;
  });

  // Sắp xếp đơn hàng theo thời gian tạo (mới nhất lên đầu)
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Hàm hiển thị trạng thái đơn hàng
  const getStatusBadge = (status, paymentStatus) => {
    if (status === 'CANCELLED' || paymentStatus === 'FAILED') {
      return <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">Đã hủy</span>
    } else if (status === 'DELIVERED') {
      return <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">Đã giao</span>
    } else if (status === 'PROCESSING') {
      return <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">Đang xử lý</span>
    } else if (status === 'PENDING') {
      return <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-xs font-medium">Đang chờ</span>
    } else if (status === 'SHIPPED') {
      return <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">Đang giao</span>
    }
    return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">{status}</span>
  }

  // Hàm hiển thị phương thức thanh toán
  const getPaymentMethod = (order, status) => {
    // Xác định phương thức thanh toán
    const methodName = getPaymentMethodName(order);
    
    // Trường hợp thanh toán khi nhận hàng
    if (methodName === 'Thanh toán khi nhận hàng') {
      return <span className="text-yellow-600">Thanh toán khi nhận hàng</span>;
    }
    
    // Các phương thức thanh toán online
    if (status === 'PAID') {
      return <span className="text-green-600">{methodName} - Đã thanh toán</span>;
    } else if (status === 'FAILED') {
      return <span className="text-red-600">{methodName} - Thanh toán thất bại</span>;
    } else {
      return <span>{methodName} - Đang xử lý</span>;
    }
  }

  // Hàm hiển thị trạng thái thanh toán
  const getPaymentStatusBadge = (status, orderStatus, order) => {
    // Xác định phương thức thanh toán
    const methodName = getPaymentMethodName(order);
    
    // Xử lý riêng cho thanh toán khi nhận hàng
    if (methodName === 'Thanh toán khi nhận hàng') {
      return <div className="bg-yellow-100 text-yellow-600 px-3 py-1.5 rounded text-sm font-medium flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
        Thanh toán khi nhận hàng
      </div>
    }
    
    // Xử lý các phương thức thanh toán online
    if (status === 'PAID') {
      return <div className="bg-green-100 text-green-600 px-3 py-1.5 rounded text-sm font-medium flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Thanh toán {methodName} thành công
      </div>
    } else if (status === 'PENDING' && orderStatus !== 'CANCELLED') {
      return <div className="bg-yellow-100 text-yellow-600 px-3 py-1.5 rounded text-sm font-medium flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Đang chờ thanh toán {methodName}
      </div>
    } else if (status === 'FAILED' || orderStatus === 'CANCELLED') {
      return <div className="bg-red-100 text-red-600 px-3 py-1.5 rounded text-sm font-medium flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Đã hủy thanh toán {methodName}
      </div>
    } else {
      // Trường hợp không xác định
      return <div className="bg-red-100 text-red-600 px-3 py-1.5 rounded text-sm font-medium flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Đã hủy thanh toán {methodName}
      </div>
    }
  }

  console.log("order Items", sortedOrders)

  return (
    <div className="bg-gray-50 min-h-screen py-4">
      <div className="container mx-auto px-4">
        <div className='bg-white shadow-md p-4 font-semibold rounded-lg mb-4'>
          <h1 className="text-xl">Đơn hàng của tôi</h1>
        </div>
        
        {!sortedOrders[0] && <NoData/>}
        
        <div className="space-y-4">
          {sortedOrders.map((order, index) => {
            // Xác định trạng thái thanh toán
            const paymentStatus = order.paymentStatus || order.payment_status;
            
            return (
              <div key={order._id + index + "order"} className='bg-white rounded-lg shadow-md p-4 text-sm'>
                <div className="flex justify-between items-center border-b pb-3 mb-3">
    <div>
                    <p className="text-gray-600">Mã đơn hàng: <span className="font-medium text-black">{order?.orderId}</span></p>
                    <p className="text-gray-600 mt-1">
                      Ngày đặt: <span className="font-medium text-black">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    {getStatusBadge(order.status, paymentStatus)}
                    <p className="text-gray-600 mt-1 text-xs">
                      {getPaymentMethod(order, paymentStatus)}
                    </p>
                  </div>
      </div>
                
                <div className="flex gap-4 items-center">
                    <img
                      src={order.product_details.image[0]} 
                    className="w-16 h-16 object-cover rounded-md" 
                    alt={order.product_details.name}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{order.product_details.name}</p>
                    <p className="text-gray-600 mt-1">Tổng tiền: <span className="font-medium text-black">
                      {DisplayPriceInRupees(order.totalAmount || order.totalAmt)}
                    </span></p>
                  </div>
                </div>
                
                {/* Phần hiển thị trạng thái thanh toán rõ ràng hơn */}
                <div className="mt-3 pt-3 border-t">
                  {getPaymentStatusBadge(paymentStatus, order.status, order)}
                </div>
                
                {/* Hiển thị thông báo khi đơn hàng bị hủy */}
                {(order.status === 'CANCELLED' || paymentStatus === 'FAILED') && 
                 (getPaymentMethodName(order) !== 'Thanh toán khi nhận hàng') && (
                  <div className="mt-3 pt-2 border-t border-red-100">
                    <p className="text-red-600 text-xs italic">Đơn hàng này đã bị hủy hoặc thanh toán thất bại</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MyOrders
