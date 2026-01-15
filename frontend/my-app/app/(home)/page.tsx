"use client";

import AnotherTopBar from "../components/layout/AnotherTopBar";
import ProductCard from "../components/layout/ProductCard";
import Banner from "../components/layout/Banner";
import ProductCategory from "../components/layout/ProductCategory";
//import LiveStream from "../components/layout/LiveStream";
import Vouchers from "../components/layout/Vouchers";
import Footer from "../components/layout/Footer";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import {
  GET_PRODUCTS_FOR_HOMEPAGE,
  GET_ADMIN_DASHBOARD_STATS,
  GET_USER_PURCHASE_CATEGORIES,
} from "@/graphql/queries";
import "../globals.css";
import { useUser } from "@/contexts/UserContext";
import React from "react";
import SectionHeader from "../components/common/SectionHeader";

/**
 * Interface mô tả cấu trúc của một sản phẩm
 * @property product_id - ID duy nhất của sản phẩm
 * @property product_name - Tên sản phẩm
 * @property product_images - Mảng chứa các hình ảnh của sản phẩm
 * @property product_variations - Mảng chứa các biến thể của sản phẩm (giá, giảm giá...)
 * @property create_at - Thời gian tạo sản phẩm (tùy chọn)
 * @property total_sales - Tổng số lượng đã bán (tùy chọn)
 * @property category - Thông tin danh mục của sản phẩm (tùy chọn)
 */
interface Product {
  product_id: number;
  product_name: string;
  brand: string;
  status: string;
  category?: {
    category_id: number;
    category_name: string;
  };
  product_images: Array<{
    image_url: string;
    is_thumbnail: boolean;
  }>;
  product_variations: Array<{
    product_variation_id: number;
    product_variation_name: string;
    base_price: number;
    percent_discount: number;
    stock_quantity: number;
    status: string;
  }>;
}

/**
 * Interface mô tả cấu trúc phản hồi từ API khi lấy danh sách sản phẩm
 * @property products - Đối tượng chứa thông tin sản phẩm và phân trang
 */
interface ProductsResponse {
  products: {
    data: Product[];
    totalCount: number;
    totalPage: number;
  };
}

/**
 * Interface mô tả cấu trúc của sản phẩm bán chạy
 * @property product_id - ID duy nhất của sản phẩm
 * @property product_name - Tên sản phẩm
 * @property total_quantity - Tổng số lượng đã bán
 * @property total_revenue - Tổng doanh thu từ sản phẩm
 * @property product - Đối tượng chứa thông tin sản phẩm
 */
interface TopSellingProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  product: {
    product_images: {
      image_url: string;
      is_thumbnail: boolean;
    }[];
    shop: {
      shop_name: string;
    };
  };
}

// Interface cho danh mục sản phẩm mà người dùng đã mua
interface Category {
  category_id: number;
  category_name: string;
  create_at: Date | null;
  update_at: Date | null;
  delete_at: Date | null;
}

/**
 * Component trang chủ của ứng dụng
 *
 * Component này hiển thị trang chủ với nhiều phần khác nhau:
 * - Kho voucher
 * - Sản phẩm dành cho người dùng
 * - Sản phẩm mới nhất
 * - Sản phẩm bán chạy
 *
 * Mỗi phần đều có thể mở rộng để xem nhiều sản phẩm hơn bằng cách nhấp vào nút bên dưới
 */


const HomePage: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();

  // ... (Queries remain the same)
  const {
    loading: loadingNewest,
    error: errorNewest,
    data: dataNewest,
  } = useQuery<ProductsResponse>(GET_PRODUCTS_FOR_HOMEPAGE, {
    variables: { page: 1, limit: 12, search: "", sort: "newest" },
    onError: (error) => console.error("Error fetching newest products:", error),
  });

  const {
    loading: loadingBestSeller,
    error: errorBestSeller,
    data: dataBestSeller,
  } = useQuery(GET_ADMIN_DASHBOARD_STATS, {
    onError: (error) => console.error("Error fetching bestseller products:", error),
  });

  const {
    loading: loadingUserCategories,
    error: errorUserCategories,
    data: dataUserCategories,
  } = useQuery(GET_USER_PURCHASE_CATEGORIES, {
    variables: { userId: user?.user_id || "" },
    skip: !user?.user_id,
    onError: (error) => console.error("Error fetching user purchase categories:", error),
  });

  const userCategoryIds = React.useMemo(() => {
    if (!dataUserCategories?.getUserPurchaseCategories) return [];
    return dataUserCategories.getUserPurchaseCategories.map((cat: Category) => cat.category_id);
  }, [dataUserCategories]);

  const {
    loading: loadingForYou,
    error: errorForYou,
    data: dataForYou,
  } = useQuery<ProductsResponse>(GET_PRODUCTS_FOR_HOMEPAGE, {
    variables: { page: 1, limit: 12, search: "" },
    skip: !user?.user_id,
    onError: (error) => console.error("Error fetching for you products:", error),
  });

  const forYouProducts = React.useMemo(() => {
    if (!dataForYou?.products?.data || userCategoryIds.length === 0) {
      return dataForYou?.products?.data || [];
    }
    return dataForYou.products.data.filter(
      (product: Product) => product.category && userCategoryIds.includes(product.category.category_id)
    );
  }, [dataForYou, userCategoryIds]);

  const newestProducts = dataNewest?.products?.data || [];
  const bestSellerProducts = dataBestSeller?.getAdminDashboardStats?.topSellingProducts || [];

  const isLoading = loadingNewest || loadingBestSeller || loadingForYou || loadingUserCategories;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-subtle">
        <AnotherTopBar />
        <div className="container mx-auto px-4 py-8 space-y-8 flex-grow">
          <div className="w-full h-80 bg-gray-200 animate-pulse rounded-2xl"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(8).fill(null).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm space-y-3 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-subtle">
      <AnotherTopBar />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        <Banner />
        
        <ProductCategory />

        {/* Voucher Section */}
        <section>
          <SectionHeader 
            title="Kho Voucher" 
            iconSrc="/icon/voucher.png"
            linkHref="/customer/category/voucher"
          />
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-teal-100">
             <Vouchers limit={2} />
          </div>
        </section>

        {/* For You Section */}
        <section>
          <SectionHeader 
            title="Dành Cho Bạn" 
            iconSrc="/icon/shopping-bag.png"
            linkHref={`/customer/category/product?sort=foryou${user?.user_id ? `&userId=${user.user_id}` : ""}`}
          />
          
          {errorForYou || errorUserCategories ? (
             <div className="text-center py-8 bg-red-50 rounded-xl">
               <p className="text-red-500">Không thể tải sản phẩm dành cho bạn</p>
             </div>
          ) : forYouProducts.length === 0 && user?.user_id ? (
             <div className="text-center py-8 bg-white rounded-xl shadow-sm">
               <p className="text-gray-500">Hãy mua sắm để nhận được đề xuất phù hợp hơn</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {forYouProducts.map((product: Product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Newest Products Section */}
        <section>
          <SectionHeader 
            title="Sản Phẩm Mới Nhất" 
            iconSrc="/icon/check-mark.png"
            linkHref="/customer/category/product?sort=newest"
          />
          
           {errorNewest ? (
             <div className="text-center py-8 bg-red-50 rounded-xl">
               <p className="text-red-500">Không thể tải sản phẩm mới nhất</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {newestProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Best Seller Section */}
        <section>
          <SectionHeader 
            title="Sản Phẩm Bán Chạy" 
            iconSrc="/icon/fire.png"
            linkHref="/customer/category/product?sort=bestseller"
          />
          
          {errorBestSeller ? (
             <div className="text-center py-8 bg-red-50 rounded-xl">
               <p className="text-red-500">Không thể tải sản phẩm bán chạy</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {bestSellerProducts.map((product: TopSellingProduct) => (
                <ProductCard
                  key={product.product_id}
                  product={{
                    product_id: Number(product.product_id),
                    product_name: product.product_name,
                    product_images: product.product.product_images,
                    product_variations: [],
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
