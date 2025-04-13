import React from 'react'
import { IoClose } from 'react-icons/io5'
import { Link, useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FaCaretRight, FaShoppingCart } from "react-icons/fa";
import { useSelector } from 'react-redux'
import AddToCartButton from './AddToCartButton'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import imageEmpty from '../assets/empty_cart.webp'
import toast from 'react-hot-toast'

const DisplayCartItem = ({close}) => {
    const { notDiscountTotalPrice, totalPrice, totalQty } = useGlobalContext()
    const cartItem = useSelector(state => state.cartItem.cart)
    const user = useSelector(state => state.user)
    const navigate = useNavigate()

    const redirectToCheckoutPage = () => {
        if(user?._id){
            navigate("/checkout")
            if(close){
                close()
            }
            return
        }
        toast("Vui lòng đăng nhập")
    }

    return (
        <section className='fixed inset-0 bg-black/60 z-50 backdrop-blur-sm'>
            <div className='bg-white w-full max-w-md min-h-screen ml-auto flex flex-col'>
                {/* Header */}
                <div className='flex items-center justify-between p-4 border-b'>
                    <div className='flex items-center gap-2'>
                        <FaShoppingCart className='text-[#E78A8C] text-xl' />
                        <h2 className='text-xl font-semibold text-gray-800'>Giỏ hàng</h2>
                    </div>
                    <button 
                        onClick={close} 
                        className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                    >
                        <IoClose size={24} className='text-gray-600' />
                    </button>
                </div>

                {/* Cart Content */}
                <div className='flex-1 overflow-auto bg-gray-50'>
                    {cartItem[0] ? (
                        <div className='p-4 space-y-4'>
                            {/* Savings Info */}
                            <div className='bg-[#E78A8C]/10 text-[#E78A8C] p-3 rounded-lg flex justify-between items-center'>
                                <p className='font-medium'>Bạn tiết kiệm được</p>
                                <p className='font-semibold'>{DisplayPriceInRupees(notDiscountTotalPrice - totalPrice)}</p>
                            </div>

                            {/* Cart Items */}
                            <div className='bg-white rounded-lg shadow-sm divide-y'>
                                {cartItem.map(item => (
                                    <div key={item?._id} className='p-4 flex gap-4'>
                                        <div className='w-20 h-20 rounded-lg border overflow-hidden bg-gray-50'>
                                            <img
                                                src={item?.productId?.image[0]}
                                                alt={item?.productId?.name}
                                                className='w-full h-full object-contain'
                                            />
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <h3 className='font-medium text-gray-800 truncate'>
                                                {item?.productId?.name}
                                            </h3>
                                            <p className='text-sm text-gray-500 mt-1'>
                                                {item?.productId?.unit}
                                            </p>
                                            <div className='mt-2 flex items-center justify-between'>
                                                <p className='font-semibold text-[#E78A8C]'>
                                                    {DisplayPriceInRupees(pricewithDiscount(item?.productId?.price, item?.productId?.discount))}
                                                </p>
                                                <div className='w-32'>
                                                    <AddToCartButton data={item?.productId} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className='h-full flex flex-col items-center justify-center p-8 text-center'>
                            <img
                                src={imageEmpty}
                                alt="Empty Cart"
                                className='w-64 h-64 object-contain mb-6'
                            />
                            <p className='text-gray-500 mb-6'>Giỏ hàng của bạn đang trống</p>
                            <Link 
                                onClick={close} 
                                to="/" 
                                className='px-6 py-3 bg-[#E78A8C] text-white rounded-full hover:bg-[#E78A8C]/90 transition-colors'
                            >
                                Mua sắm ngay
                            </Link>
                        </div>
                    )}
                </div>

                {/* Cart Summary */}
                {cartItem[0] && (
                    <div className='border-t bg-white p-4 space-y-4'>
                        <div className='space-y-2'>
                            <div className='flex justify-between text-sm text-gray-600'>
                                <span>Tổng sản phẩm ({totalQty})</span>
                                <div className='flex items-center gap-2'>
                                    <span className='line-through text-gray-400'>
                                        {DisplayPriceInRupees(notDiscountTotalPrice)}
                                    </span>
                                    <span>{DisplayPriceInRupees(totalPrice)}</span>
                                </div>
                            </div>
                            <div className='flex justify-between text-sm text-gray-600'>
                                <span>Phí vận chuyển</span>
                                <span className='text-[#E78A8C]'>Miễn phí</span>
                            </div>
                            <div className='flex justify-between font-semibold text-gray-800 pt-2 border-t'>
                                <span>Tổng tiền</span>
                                <span>{DisplayPriceInRupees(totalPrice)}</span>
                            </div>
                        </div>

                        <button
                            onClick={redirectToCheckoutPage}
                            className='w-full py-3 bg-[#E78A8C] text-white rounded-full font-medium hover:bg-[#E78A8C]/90 transition-colors flex items-center justify-center gap-2'
                        >
                            <span>Thanh toán</span>
                            <FaCaretRight />
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}

export default DisplayCartItem
