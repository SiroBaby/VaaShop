"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_CATEGORIES } from "@/graphql/queries";
import { useRouter } from "next/navigation";

// Define interfaces for type safety
interface Category {
  category_id: number;
  category_name: string;
  create_at: string;
  update_at: string;
}

interface CategoriesResponse {
  categorys: {
    data: Category[];
    totalCount: number;
    totalPage: number;
  };
}

// Map of category names to icons
const categoryIcons: Record<string, string> = {
  "Quần áo": "/icon/brand.png",
  "Giày dép": "/icon/shoes.png",
  "Đồng hồ": "/icon/hand-watch.png",
  "Điện thoại": "/icon/iphone.png",
  "Máy tính & laptop": "/icon/computer.png",
  "Phụ kiện máy tính": "/icon/keyboard.png",
  "Linh kiện điện tử": "/icon/ram-memory.png",
  // Add more mappings as needed
};

// Default fallback icon
const defaultIcon = "/icon/brand.png";

const ProductCategory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Fetch categories from GraphQL API
  const { loading, error, data } = useQuery<CategoriesResponse>(
    GET_CATEGORIES,
    {
      variables: {
        page: 1,
        limit: 7,
        search: "",
      },
    }
  );

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Navigate to category products page
  const navigateToCategory = (categoryId: number, categoryName: string) => {
    router.push(
      `/customer/category/product?category=${categoryId}&categoryName=${encodeURIComponent(
        categoryName
      )}`
    );
  };

  // Prepare categories data - use data from API or fallback to default categories
  const categories = data?.categorys?.data || [];

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded-lg p-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-semibold mb-4 hidden md:block">
              Danh mục
            </h2>
          </div>
          <div className="flex flex-col items-center md:flex-row md:flex-wrap md:justify-between">
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <div
                key={item}
                className="flex flex-col items-center mb-4 md:mb-6 md:mx-4 animate-pulse"
              >
                <div className="bg-gray-200 rounded-full w-10 h-10 mb-2"></div>
                <div className="bg-gray-200 h-4 w-20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.error("Error fetching categories:", error);
    // Continue with default UI as fallback
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-brand-gradient">
          Danh mục sản phẩm
        </h2>
        <button 
          onClick={toggleDropdown}
          className="text-sm text-gray-500 hover:text-brand-start transition-colors md:hidden"
        >
          {isOpen ? "Thu gọn" : "Xem tất cả"}
        </button>
      </div>

      <div className={`
        ${isOpen ? "grid grid-cols-2 gap-4" : "flex overflow-x-auto pb-4 gap-4 snap-x"} 
        md:grid md:grid-cols-7 md:gap-6 md:pb-0 scrollbar-hide
      `}>
        {categories.length > 0 ? (
          categories.map((category) => (
            <div
              key={category.category_id}
              onClick={() => navigateToCategory(category.category_id, category.category_name)}
              className="flex-shrink-0 snap-center flex flex-col items-center group cursor-pointer w-[100px] md:w-auto"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-brand-gradient group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 relative overflow-hidden border border-gray-100 group-hover:border-transparent">
                 <div className="relative w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:scale-110 group-hover:brightness-0 group-hover:invert">
                    <Image
                      src={categoryIcons[category.category_name] || defaultIcon}
                      fill
                      className="object-contain p-1"
                      alt={category.category_name}
                    />
                 </div>
              </div>
              <p className="text-center text-sm font-medium text-gray-600 group-hover:text-brand-start transition-colors line-clamp-2 px-1">
                {category.category_name}
              </p>
            </div>
          ))
        ) : (
          // Fallback static data rewritten to match structure
          Object.keys(categoryIcons).slice(0, 7).map((name, index) => (
             <div
              key={index}
              className="flex-shrink-0 snap-center flex flex-col items-center group cursor-pointer w-[100px] md:w-auto"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-brand-gradient group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 relative overflow-hidden border border-gray-100 group-hover:border-transparent">
                 <div className="relative w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:scale-110 group-hover:brightness-0 group-hover:invert">
                    <Image
                      src={categoryIcons[name]}
                      fill
                      className="object-contain p-1"
                      alt={name}
                    />
                 </div>
              </div>
              <p className="text-center text-sm font-medium text-gray-600 group-hover:text-brand-start transition-colors line-clamp-2 px-1">
                {name}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductCategory;
