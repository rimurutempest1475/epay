import React, { useState } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import AddAddress from '../components/AddAddress'
import { useSelector, useDispatch } from 'react-redux'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import axios from 'axios'
import { createOrder, createStripePayment, createMomoPayment, createCryptoPayment } from "../redux/actions/orderAction";

const CheckoutPage = () => {
  const { notDiscountTotalPrice, totalPrice, totalQty, fetchCartItem, fetchOrder, user } = useGlobalContext()
  const [openAddress, setOpenAddress] = useState(false)
  const addressList = useSelector(state => state.addresses.addressList)
  const [selectAddress, setSelectAddress] = useState(0)
  const cartItemsList = useSelector(state => state.cartItem.cart)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")

  // Xử lý "Thanh toán khi nhận hàng"
  const handleCashOnDelivery = async() => {
    try {
      const response = await Axios({
        ...SummaryApi.CashOnDeliveryOrder,
        data : {
          list_items : cartItemsList,
          addressId : addressList[selectAddress]?._id,
          subTotalAmt : totalPrice,
          totalAmt : totalPrice,
        }
      })

      const { data : responseData } = response

      if(responseData.success){
          toast.success(responseData.message)
          if(fetchCartItem) fetchCartItem()
          if(fetchOrder) fetchOrder()
          navigate('/success', { state : { text : "Order" } })
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  // Xử lý thanh toán qua Stripe
  const handleOnlinePayment = async()=>{
    try {
        toast.loading("Đang chuyển hướng đến Stripe...")
        const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY
        const stripePromise = await loadStripe(stripePublicKey)
       
        const response = await Axios({
            ...SummaryApi.payment_url,
            data : {
              list_items : cartItemsList,
              addressId : addressList[selectAddress]?._id,
              subTotalAmt : totalPrice,
              totalAmt :  totalPrice,
            }
        })

        const { data : responseData } = response
        stripePromise.redirectToCheckout({ sessionId : responseData.id })
        
        if(fetchCartItem) fetchCartItem()
        if(fetchOrder) fetchOrder()
    } catch (error) {
        AxiosToastError(error)
    }
  }

  // Thêm: Xử lý thanh toán qua VNPay
  const handleVnpayPayment = async () => {
    try {
      toast.loading("Đang chuyển hướng tới cổng thanh toán VNPay...")
      const response = await Axios({
        // Cần cấu hình route vnpay_payment_url trong SummaryApi
        ...SummaryApi.vnpay_payment_url, 
        data: {
          list_items : cartItemsList,
          addressId : addressList[selectAddress]?._id,
          subTotalAmt : totalPrice,
          totalAmt : totalPrice,
        }
      })

      const { data: responseData } = response
      if (responseData.paymentUrl) {
        // Server trả về đường dẫn cổng thanh toán
        window.location.href = responseData.paymentUrl
      } else {
        toast.error("Không nhận được paymentUrl từ server")
      }

      if(fetchCartItem) fetchCartItem()
      if(fetchOrder) fetchOrder()
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleMoMoPayment = async () => {
    try {
      if (!addressList[selectAddress]) {
        toast.error('Vui lòng chọn địa chỉ giao hàng');
        return;
      }

      setIsLoading(true);
      toast.loading("Đang chuyển hướng đến MoMo...");

      // Đảm bảo list_items có định dạng đúng
      const formattedItems = cartItemsList.map(item => ({
        productId: item.productId?._id || item.productId,
        quantity: item.quantity,
        price: item.price
      }));

      const requestData = {
        list_items: formattedItems,
        addressId: addressList[selectAddress]._id,
        totalAmt: totalPrice
      };

      console.log('Sending MoMo request:', JSON.stringify(requestData, null, 2));

      const response = await Axios({
        ...SummaryApi.create_momo_payment,
        withCredentials: true,
        data: requestData
      });

      console.log('MoMo payment response:', response.data);

      if (response?.data?.payUrl) {
        window.location.href = response.data.payUrl;
      } else {
        toast.error('Không nhận được URL thanh toán từ MoMo');
        setIsLoading(false);
        toast.dismiss();
      }
    } catch (error) {
      console.error('MoMo payment error:', error.response || error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Lỗi không xác định khi tạo thanh toán MoMo');
      }
      setIsLoading(false);
      toast.dismiss();
    }
  };

  const handlePayment = async () => {
    try {
        if (!addressList[selectAddress]) {
            toast.error('Vui lòng chọn địa chỉ giao hàng');
            return;
        }

        const orderData = {
            list_items: cartItemsList,
            addressId: addressList[selectAddress]._id,
            subTotalAmt: totalPrice,
            totalAmt: totalPrice,
            paymentMethod: paymentMethod,
            paymentStatus: "pending",
            orderStatus: "pending"
        };

        setIsLoading(true);

        if (paymentMethod === "cash") {
            dispatch(createOrder(orderData));
        } else if (paymentMethod === "stripe") {
            dispatch(createStripePayment(orderData));
        } else if (paymentMethod === "momo") {
            dispatch(createMomoPayment(orderData));
        } else if (paymentMethod === "crypto") {
            dispatch(createCryptoPayment(orderData));
        }
    } catch (error) {
        console.error("Payment error:", error);
        toast.error("Payment failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <section className='bg-blue-50'>
      <div className='container mx-auto p-4 flex flex-col lg:flex-row w-full gap-5 justify-between'>
        <div className='w-full'>
          {/** Chọn địa chỉ **/}
          <h3 className='text-lg font-semibold'>Chọn địa chỉ của bạn</h3>
          <div className='bg-white p-2 grid gap-4'>
            {
              addressList.map((address, index) => {
                return (
                  <label key={index} htmlFor={"address" + index} className={!address.status && "hidden"}>
                    <div className='border rounded p-3 flex gap-3 hover:bg-blue-50'>
                      <div>
                        <input id={"address" + index} type='radio' value={index} onChange={(e) => setSelectAddress(e.target.value)} name='address' />
                      </div>
                      <div>
                        <p>{address.address_line}</p>
                        <p>{address.city}</p>
                        <p>{address.state}</p>
                        <p>{address.country} - {address.pincode}</p>
                        <p>{address.mobile}</p>
                      </div>
                    </div>
                  </label>
                )
              })
            }
            <div onClick={() => setOpenAddress(true)} className='h-16 bg-blue-50 border-2 border-dashed flex justify-center items-center cursor-pointer'>
              Thêm địa chỉ mới
            </div>
          </div>
        </div>

        <div className='w-full max-w-md bg-white py-4 px-2'>
          {/** Chi tiết hóa đơn **/}
          <h3 className='text-lg font-semibold'>Chi tiết thanh toán:</h3>
          <div className='bg-white p-4'>
            <h3 className='font-semibold'>Chi tiết hóa đơn:</h3>
            <div className='flex gap-4 justify-between ml-1'>
              <p>Tổng tiền</p>
              <p className='flex items-center gap-2'>
                <span className='line-through text-neutral-400'>
                  {DisplayPriceInRupees(notDiscountTotalPrice)}
                </span>
                <span>{DisplayPriceInRupees(totalPrice)}</span>
              </p>
            </div>
            <div className='flex gap-4 justify-between ml-1'>
              <p>Số lượng</p>
              <p className='flex items-center gap-2'>{totalQty} sản phẩm</p>
            </div>
            <div className='flex gap-4 justify-between ml-1'>
              <p>Phí vận chuyển</p>
              <p className='flex items-center gap-2'>Miễn phí</p>
            </div>
            <div className='font-semibold flex items-center justify-between gap-4'>
              <p>Tổng cộng</p>
              <p>{DisplayPriceInRupees(totalPrice)}</p>
            </div>
          </div>
          
          {/** Các phương thức thanh toán **/}
          <div className='w-full flex flex-col gap-4'>
            <h3 className='text-lg font-semibold'>Chọn phương thức thanh toán:</h3>
            
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <input
                        type="radio"
                        name="payment"
                        id="cash"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="form-radio"
                    />
                    <label htmlFor="cash" className="text-gray-700">
                        Thanh toán khi nhận hàng
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="radio"
                        name="payment"
                        id="stripe"
                        value="stripe"
                        checked={paymentMethod === "stripe"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="form-radio"
                    />
                    <label htmlFor="stripe" className="text-gray-700">
                        Thanh toán qua Stripe
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="radio"
                        name="payment"
                        id="momo"
                        value="momo"
                        checked={paymentMethod === "momo"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="form-radio"
                    />
                    <label htmlFor="momo" className="text-gray-700">
                        Thanh toán qua MoMo
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="radio"
                        name="payment"
                        id="crypto"
                        value="crypto"
                        checked={paymentMethod === "crypto"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="form-radio"
                    />
                    <label htmlFor="crypto" className="text-gray-700">
                        Thanh toán bằng tiền điện tử (Bitcoin, Ethereum, etc.)
                    </label>
                </div>
            </div>

            <button
                onClick={handlePayment}
                disabled={!addressList[selectAddress] || isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 mt-4"
            >
                {isLoading ? "Đang xử lý..." : "Thanh toán ngay"}
            </button>
          </div>
        </div>
      </div>

      {openAddress && (
        <AddAddress close={() => setOpenAddress(false)} />
      )}
    </section>
  )
}

export default CheckoutPage