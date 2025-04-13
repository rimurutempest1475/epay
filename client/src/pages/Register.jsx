import React, { useState } from 'react'
import { FaRegEyeSlash } from "react-icons/fa6";
import { FaRegEye } from "react-icons/fa6";
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Register = () => {
    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target

        setData((preve) => {
            return {
                ...preve,
                [name]: value
            }
        })
    }

    const valideValue = Object.values(data).every(el => el)

    const handleSubmit = async(e)=>{
        e.preventDefault()

        if(data.password !== data.confirmPassword){
            toast.error(
                "Mật khẩu xác nhận và mật khẩu phải giống nhau!"
            )
            return
        }

        try {
            const response = await Axios({
                ...SummaryApi.register,
                data : data
            })
            
            if(response.data.error){
                toast.error(response.data.message)
            }

            if(response.data.success){
                toast.success(response.data.message)
                setData({
                    name : "",
                    email : "",
                    password : "",
                    confirmPassword : ""
                })
                navigate("/login")
            }

        } catch (error) {
            AxiosToastError(error)
        }
    }

    return (
        <section className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md'>
                <div className='flex flex-col items-center'>
                    <img src={logo} alt="4U Cosmetics Logo" className="w-48 mb-6" />
                    <h2 className='text-2xl font-bold text-gray-800 mb-4'>Đăng ký tài khoản</h2>
                    <p className='text-gray-600 mb-6'>Chào mừng bạn đến với 4U Cosmetics</p>
                </div>

                <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
                    <div className='space-y-4'>
                        <div>
                            <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                                Họ tên
                            </label>
                            <input
                                type='text'
                                id='name'
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#E78A8C] focus:border-[#E78A8C]'
                                name='name'
                                value={data.name}
                                onChange={handleChange}
                                placeholder='Nhập họ tên của bạn'
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                                Email
                            </label>
                            <input
                                type='email'
                                id='email'
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#E78A8C] focus:border-[#E78A8C]'
                                name='email'
                                value={data.email}
                                onChange={handleChange}
                                placeholder='Nhập email của bạn'
                            />
                        </div>

                        <div>
                            <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                                Mật khẩu
                            </label>
                            <div className='mt-1 relative rounded-md shadow-sm'>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id='password'
                                    className='block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#E78A8C] focus:border-[#E78A8C]'
                                    name='password'
                                    value={data.password}
                                    onChange={handleChange}
                                    placeholder='Nhập mật khẩu'
                                />
                                <div 
                                    onClick={() => setShowPassword(prev => !prev)} 
                                    className='absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700'
                                >
                                    {showPassword ? <FaRegEye size={20} /> : <FaRegEyeSlash size={20} />}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700'>
                                Xác nhận mật khẩu
                            </label>
                            <div className='mt-1 relative rounded-md shadow-sm'>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id='confirmPassword'
                                    className='block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#E78A8C] focus:border-[#E78A8C]'
                                    name='confirmPassword'
                                    value={data.confirmPassword}
                                    onChange={handleChange}
                                    placeholder='Nhập lại mật khẩu'
                                />
                                <div 
                                    onClick={() => setShowConfirmPassword(prev => !prev)} 
                                    className='absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700'
                                >
                                    {showConfirmPassword ? <FaRegEye size={20} /> : <FaRegEyeSlash size={20} />}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        disabled={!valideValue} 
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-medium ${
                            valideValue 
                            ? "bg-[#E78A8C] hover:bg-[#E78A8C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E78A8C]" 
                            : "bg-gray-300 cursor-not-allowed"
                        }`}
                    >
                        Đăng ký
                    </button>
                </form>

                <div className='mt-6 text-center'>
                    <p className='text-sm text-gray-600'>
                        Đã có tài khoản? {' '}
                        <Link to="/login" className='font-medium text-[#E78A8C] hover:text-[#E78A8C]/80'>
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}

export default Register
