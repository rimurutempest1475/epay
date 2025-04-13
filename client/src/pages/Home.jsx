import React, { useState, useEffect } from 'react';  
import banner from '../assets/banner.jpg';  
import bannerMobile from '../assets/banner-mobile.jpg';  
import { useSelector } from 'react-redux';  
import { valideURLConvert } from '../utils/valideURLConvert';  
import { Link, useNavigate } from 'react-router-dom';  
import CategoryWiseProductDisplay from '../components/CategoryWiseProductDisplay';  
import ParticleEffect from '../components/ParticleEffect';

// Thay đổi đường dẫn hình ảnh theo tên tệp của bạn  
import banner1 from '../assets/Frame 5.png';  
import banner2 from '../assets/banner2.png';  
import banner3 from '../assets/banner3.png';   

const images = [banner1, banner2, banner3];  

const Home = () => {  
  const loadingCategory = useSelector(state => state.product.loadingCategory);  
  const categoryData = useSelector(state => state.product.allCategory);  
  const subCategoryData = useSelector(state => state.product.allSubCategory);  
  const navigate = useNavigate();  

  const handleRedirectProductListpage = (id, cat) => {  
    console.log(id, cat);  
    const subcategory = subCategoryData.find(sub => {  
      const filterData = sub.category.some(c => {  
        return c._id == id;  
      });  
      return filterData ? true : null;  
    });  
    const url = `/${valideURLConvert(cat)}-${id}/${valideURLConvert(subcategory.name)}-${subcategory._id}`;  
    navigate(url);  
    console.log(url);  
  };  

  const [currentIndex, setCurrentIndex] = useState(0);  

  useEffect(() => {  
    const interval = setInterval(() => {  
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);  
    }, 3000);  
    return () => clearInterval(interval);  
  }, []);  

  const nextSlide = () => {  
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);  
  };  

  const prevSlide = () => {  
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);  
  };  

  return (  
    <div className="relative">
      <div className="absolute inset-0 z-0">
        <ParticleEffect />
      </div>
      <section className='relative z-10 bg-white/80 backdrop-blur-sm'>  
        <div className='container mx-auto'>  
          <div className="relative w-full overflow-hidden">  
            <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>  
              {images.map((image, index) => (  
                <div key={index} className="min-w-full flex justify-center">  
                  <img src={image} alt={`Banner ${index + 1}`} className="w-auto h-auto max-h-[400px] object-contain" /> {/* Chiều cao tối đa */}  
                </div>  
              ))}  
            </div>  
            <button onClick={prevSlide} className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow">  
              &#10094;  
            </button>  
            <button onClick={nextSlide} className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow">  
              &#10095;  
            </button>  
          </div>  
        </div>  

        <div className='container mx-auto px-4 my-2 grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2'>  
          {  
            loadingCategory ? (  
              new Array(12).fill(null).map((c, index) => {  
                return (  
                  <div key={index + "loadingcategory"} className='bg-white rounded p-4 min-h-36 grid gap-2 shadow animate-pulse'>  
                    <div className='bg-blue-100 min-h-24 rounded'></div>  
                    <div className='bg-blue-100 h-8 rounded'></div>  
                  </div>  
                )  
              })  
            ) : (  
              categoryData.map((cat, index) => {  
                return (  
                  <div key={cat._id + "displayCategory"} className='w-full h-full' onClick={() => handleRedirectProductListpage(cat._id, cat.name)}>  
                    <div>  
                      <img  
                        src={cat.image}  
                        className='w-full h-full object-scale-down'  
                      />  
                    </div>  
                  </div>  
                )  
              })  
            )  
          }  
        </div>  

        {/***display category product */}  
        {  
          categoryData?.map((c, index) => {  
            return (  
              <CategoryWiseProductDisplay  
                key={c?._id + "CategorywiseProduct"}  
                id={c?._id}  
                name={c?.name}  
              />  
            )  
          })  
        }  
      </section>  
    </div>  
  )  
}  

export default Home;  