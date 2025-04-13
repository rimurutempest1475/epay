import React, { useEffect,useState } from 'react';
import logo from '../assets/logo.png';
import Search from './Search';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaRegCircleUser } from 'react-icons/fa6';
import useMobile from '../hooks/useMobile';
import { BsCart4 } from 'react-icons/bs';
import { useSelector } from 'react-redux';
import { GoTriangleDown, GoTriangleUp } from 'react-icons/go';
import UserMenu from './UserMenu';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import { useGlobalContext } from '../provider/GlobalProvider';
import DisplayCartItem from './DisplayCartItem';

const Header = () => {
    const [isMobile] = useMobile();
    const location = useLocation();
    const isSearchPage = location.pathname === '/search';
    const navigate = useNavigate();
    const user = useSelector((state) => state?.user);
    const [openUserMenu, setOpenUserMenu] = useState(false);
    const cartItem = useSelector((state) => state.cartItem.cart);
    const { totalPrice, totalQty } = useGlobalContext();
    const [openCartSection, setOpenCartSection] = useState(false);

    const redirectToLoginPage = () => navigate('/login');
    const handleCloseUserMenu = () => setOpenUserMenu(false);
    const handleMobileUser = () => (!user._id ? navigate('/login') : navigate('/user'));
    
    const [showMenu, setShowMenu] = useState(true)

    useEffect(() => {
        let lastScrollY = window.scrollY
        const handleScroll = () => {
            if (window.scrollY > lastScrollY) {
                setShowMenu(false)
            } else {
                setShowMenu(true)
            }
            lastScrollY = window.scrollY
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
            {/* Main header content */}
            {(!isSearchPage || !isMobile) && (
                <div className="container mx-auto flex items-center justify-between h-20 px-4">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center transition-transform hover:scale-105">
                            <img src={logo} width={170} height={60} alt="logo" className="hidden lg:block" />
                            <img src={logo} width={120} height={60} alt="logo" className="lg:hidden" />
                        </Link>
                    </div>

                    {/* Navigation Menu & Search */}
                    <div className="hidden lg:flex flex-grow justify-center items-center gap-8 mx-8">
                        <nav>
                            <ul className="flex items-center gap-6 text-base font-semibold">
                                <li>
                                    <Link to="/" className="px-3 py-2 hover:text-[#E78A8C] transition-colors">
                                        Trang chủ
                                    </Link>
                                </li>
                                <li className="relative group">
                                    <span className="px-3 py-2 cursor-pointer hover:text-[#E78A8C] transition-colors">
                                        Sản phẩm
                                    </span>
                                    <ul className="hidden group-hover:block absolute left-0 w-48 bg-white shadow-lg border border-gray-100 rounded-lg py-2 mt-1">
                                        <li>
                                            <Link to="/products/type1" className="block w-full px-4 py-2 hover:bg-[#E78A8C] hover:text-white transition-all duration-300">
                                                Blush
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/products/type2" className="block w-full px-4 py-2 hover:bg-[#E78A8C] hover:text-white transition-all duration-300">
                                                Cushion
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/products/type3" className="block w-full px-4 py-2 hover:bg-[#E78A8C] hover:text-white transition-all duration-300">
                                                Mascara
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/products/type4" className="block w-full px-4 py-2 hover:bg-[#E78A8C] hover:text-white transition-all duration-300">
                                                Son Môi
                                            </Link>
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <Link to="/contact" className="px-3 py-2 hover:text-[#E78A8C] transition-colors">
                                        Liên hệ
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/feedback" className="px-3 py-2 hover:text-[#E78A8C] transition-colors">
                                        Feedback
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                        <div className="w-[300px]">
                            <Search />
                        </div>
                    </div>

                    {/* User & Cart */}
                    <div className="flex items-center gap-6">
                        {/* Mobile User Icon */}
                        <button className="text-neutral-600 lg:hidden hover:text-[#E78A8C] transition-colors" onClick={handleMobileUser}>
                            <FaRegCircleUser size={26} />
                        </button>

                        {/* Desktop User Menu */}
                        {user?._id ? (
                            <div className="relative">
                                <div 
                                    onClick={() => setOpenUserMenu((prev) => !prev)} 
                                    className="flex select-none items-center gap-1 cursor-pointer hover:text-[#E78A8C] transition-colors"
                                >
                                    <p>Tài khoản</p>
                                    {openUserMenu ? <GoTriangleUp size={20} /> : <GoTriangleDown size={20} />}
                                </div>
                                {openUserMenu && (
                                    <div className="absolute right-0 top-10 bg-white rounded-lg p-4 min-w-52 shadow-lg border border-gray-100">
                                        <UserMenu close={handleCloseUserMenu} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button 
                                onClick={redirectToLoginPage} 
                                className="text-lg px-4 py-2 rounded-full bg-[#E78A8C] text-white hover:bg-[#E78A8C]/80 transition-colors"
                            >
                                Đăng nhập
                            </button>
                        )}

                        {/* Cart */}
                        <button 
                            onClick={() => setOpenCartSection(true)} 
                            className="flex items-center gap-2 bg-[#E78A8C] hover:bg-[#E78A8C]/80 px-4 py-2 rounded-full text-white transition-all hover:scale-105"
                        >
                            <div className="animate-bounce">
                                <BsCart4 size={26} />
                            </div>
                            <div className="font-semibold text-sm">
                                {cartItem[0] ? (
                                    <div>
                                        <p>{totalQty} Sản phẩm</p>
                                        <p>{DisplayPriceInRupees(totalPrice)}</p>
                                    </div>
                                ) : (
                                    <p>Giỏ hàng</p>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Cart Display */}
            {openCartSection && <DisplayCartItem close={() => setOpenCartSection(false)} />}
        </header>
    );
};

export default Header;
