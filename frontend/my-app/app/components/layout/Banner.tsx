/* eslint-disable react-hooks/exhaustive-deps */
"use client";   

import React, { useState, useEffect } from 'react';  
import Image from 'next/image';  

const Banner = () => {  
  const banners = [  
    "/banner/banner_home1.png",  
    "/banner/capybara.png",  
    "/banner/capybara-thumb.jpg",  
  ];  

  const [currentIndex, setCurrentIndex] = useState(0);  

  const nextBanner = () => {  
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);  
  };  

  // Thiết lập timer để tự động chuyển banner  
  useEffect(() => {  
    const timer = setInterval(() => {  
      nextBanner();  
    }, 5000); // Thay đổi banner mỗi 5 giây  

    return () => clearInterval(timer); // Dọn dẹp timer khi component bị unmount  
  }, []); // Chỉ chạy một lần khi component được mount  

  return (  

    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg group">
      <div className="relative w-full aspect-[21/9] md:aspect-[2.5/1]">
        <Image
          src={banners[currentIndex]}
          alt={`Banner Sale ${currentIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover transition-transform duration-700 hover:scale-105"
          priority
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              currentIndex === index 
                ? 'bg-white w-6 md:w-8' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Xem banner ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Navigation Arrows (Optional - visible on hover) */}
      <button 
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button 
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        onClick={nextBanner}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
};  

export default Banner;