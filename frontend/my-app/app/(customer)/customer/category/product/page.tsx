"use client";

import React, { useState, useEffect } from "react";
//import FilterSidebar from "@/app/components/layout/FilterSidebar";
import ProductCard from "@/app/components/layout/ProductCard";
import { useQuery } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GET_PRODUCTS_FOR_HOMEPAGE,
  GET_USER_PURCHASE_CATEGORIES,
  GET_ADMIN_DASHBOARD_STATS,
} from "@/graphql/queries";
import { useUser } from "@/contexts/UserContext";
import Image from "next/image";

// Định nghĩa các interface cho dữ liệu sản phẩm
/**
 * Interface mô tả cấu trúc hình ảnh của sản phẩm
 * @property image_url - Đường dẫn đến hình ảnh
 * @property is_thumbnail - Đánh dấu có phải là ảnh đại diện hay không
 */
interface ProductImage {
  image_url: string;
  is_thumbnail: boolean;
}

/**
 * Interface mô tả biến thể của sản phẩm
 * @property base_price - Giá gốc của sản phẩm
 * @property percent_discount - Phần trăm giảm giá (từ 0 đến 1)
 */
interface ProductVariation {
  base_price: number;
  percent_discount: number;
}

/**
 * Interface mô tả cấu trúc đầy đủ của một sản phẩm
 * @property product_id - ID duy nhất của sản phẩm
 * @property product_name - Tên sản phẩm
 * @property product_images - Mảng chứa các hình ảnh của sản phẩm
 * @property product_variations - Mảng chứa các biến thể của sản phẩm (kích cỡ, màu sắc...)
 * @property category - Thông tin danh mục của sản phẩm (tùy chọn)
 * @property create_at - Thời gian tạo sản phẩm (tùy chọn)
 * @property total_sales - Tổng số lượng đã bán (tùy chọn)
 * @property brand - Thương hiệu sản phẩm (tùy chọn)
 */
interface Product {
  product_id: number;
  product_name: string;
  product_images: ProductImage[];
  product_variations: ProductVariation[];
  category?: {
    category_id: number;
  };
  create_at?: string;
  total_sales?: number;
  brand?: string;
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

// Interface cho danh mục sản phẩm mà người dùng đã mua
interface Category {
  category_id: number;
  category_name: string;
  create_at: Date | null;
  update_at: Date | null;
  delete_at: Date | null;
}

/**
 * Các tùy chọn sắp xếp sản phẩm
 * - newest: Sản phẩm mới nhất
 * - bestseller: Sản phẩm bán chạy nhất
 * - price_asc: Giá tăng dần
 * - price_desc: Giá giảm dần
 * - foryou: Sản phẩm được đề xuất cho người dùng
 */
type SortOption =
  | "newest"
  | "bestseller"
  | "price_asc"
  | "price_desc"
  | "foryou";

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

/**
 * Component trang danh sách sản phẩm
 *
 * Component này hiển thị danh sách sản phẩm với các tùy chọn lọc và sắp xếp.
 * Hỗ trợ tìm kiếm, lọc theo danh mục, thương hiệu và sắp xếp theo nhiều tiêu chí.
 */
const ProductPage = () => {
  // Khởi tạo các hook cần thiết
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Lấy các thông số từ URL
  const searchTerm = searchParams.get("search") || "";
  const categoryId = searchParams.get("category");
  const categoryName = searchParams.get("categoryName");
  const sortParam = (searchParams.get("sort") || "newest") as SortOption;
  const userId = searchParams.get("userId");
  const selectedCategories =
    searchParams.get("category")?.split(",").map(Number) || [];
  const currentPage = parseInt(searchParams.get("page") || "1");
  const itemsPerPage = 30; // Số sản phẩm hiển thị trên mỗi trang là 30 sản phẩm

  // State để quản lý tiêu chí sắp xếp
  const [sortBy, setSortBy] = useState<SortOption>(sortParam);

  // Cập nhật sortBy khi URL thay đổi
  useEffect(() => {
    setSortBy(sortParam);
  }, [sortParam]);

  /**
   * Chuyển hướng về trang chủ
   * Được gọi khi người dùng nhấp vào liên kết "Home" trong breadcrumb
   */
  const navigateToHome = () => {
    router.push("/");
  };

  // Gọi API để lấy danh sách sản phẩm sử dụng Apollo Client
  const { loading, error, data } = useQuery<ProductsResponse>(
    GET_PRODUCTS_FOR_HOMEPAGE,
    {
      variables: {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        category: categoryId ? parseInt(categoryId) : undefined,
        sort: sortParam,
        userId: userId || user?.user_id,
      },
    }
  );

  // Query lấy danh mục sản phẩm mà người dùng đã mua
  const { data: dataUserCategories } = useQuery(GET_USER_PURCHASE_CATEGORIES, {
    variables: {
      userId: user?.user_id || "",
    },
    skip: !user?.user_id,
    onError: (error) => {
      console.error("Error fetching user purchase categories:", error);
    },
  });

  // Query lấy top sản phẩm bán chạy
  const { data: dataBestSeller } = useQuery(GET_ADMIN_DASHBOARD_STATS, {
    onError: (error) => {
      console.error("Error fetching bestseller products:", error);
    },
  });

  /**
   * Tạo dữ liệu mẫu khi chưa có dữ liệu thật từ API
   * Sẽ hiển thị khi đang tải dữ liệu hoặc khi có lỗi từ API
   */
  const sampleProducts: Product[] = Array(40)
    .fill(null)
    .map((_, index) => ({
      product_id: index,
      product_name: `Sample Product ${index + 1}`,
      product_images: [
        {
          image_url: "/icon/null.png",
          is_thumbnail: true,
        },
      ],
      product_variations: [
        {
          base_price: 100000,
          percent_discount: 0.1,
        },
      ],
      create_at: new Date(
        Date.now() - Math.random() * 10000000000
      ).toISOString(),
      total_sales: Math.floor(Math.random() * 1000),
    }));

  // Sử dụng dữ liệu thật nếu có, nếu không sẽ dùng dữ liệu mẫu
  const allProducts = data?.products?.data || sampleProducts;

  // Lọc sản phẩm theo danh mục đã chọn
  const filteredByCategories =
    selectedCategories.length > 0
      ? allProducts.filter((product) =>
          selectedCategories.includes(product.category?.category_id || 0)
        )
      : allProducts;

  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredBySearch = searchTerm
    ? filteredByCategories.filter((product) =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredByCategories;

  // Sắp xếp sản phẩm dựa trên tiêu chí đã chọn
  const sortedProducts = [...filteredBySearch].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.create_at || "").getTime() -
          new Date(a.create_at || "").getTime()
        );
      case "bestseller":
        // Nếu có dữ liệu sản phẩm bán chạy, sử dụng dữ liệu đó để sắp xếp
        if (dataBestSeller?.getAdminDashboardStats?.topSellingProducts) {
          const bestSellers =
            dataBestSeller.getAdminDashboardStats.topSellingProducts;
          const aIndex = bestSellers.findIndex(
            (item: TopSellingProduct) =>
              item.product_id === a.product_id.toString()
          );
          const bIndex = bestSellers.findIndex(
            (item: TopSellingProduct) =>
              item.product_id === b.product_id.toString()
          );

          // Nếu cả hai sản phẩm đều có trong danh sách bán chạy
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex; // Sắp xếp theo thứ tự trong danh sách bán chạy
          }

          // Nếu chỉ một sản phẩm có trong danh sách bán chạy
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
        }

        // Nếu không có dữ liệu sản phẩm bán chạy, sử dụng total_sales
        return (b.total_sales || 0) - (a.total_sales || 0);
      case "price_asc":
        return (
          (a.product_variations[0]?.base_price || 0) -
          (b.product_variations[0]?.base_price || 0)
        );
      case "price_desc":
        return (
          (b.product_variations[0]?.base_price || 0) -
          (a.product_variations[0]?.base_price || 0)
        );
      case "foryou":
        // Sắp xếp theo thứ tự dành cho bạn (ưu tiên sản phẩm trong danh mục người dùng đã mua)
        if (user?.user_id && dataUserCategories?.getUserPurchaseCategories) {
          const userCategoryIds =
            dataUserCategories.getUserPurchaseCategories.map(
              (cat: Category) => cat.category_id
            );

          const aInUserCategory =
            a.category && userCategoryIds.includes(a.category.category_id);
          const bInUserCategory =
            b.category && userCategoryIds.includes(b.category.category_id);

          if (aInUserCategory && !bInUserCategory) return -1;
          if (!aInUserCategory && bInUserCategory) return 1;
        }
        return 0;
      default:
        return 0;
    }
  });

  // Lọc sản phẩm bán chạy nếu đang ở chế độ bestseller
  const finalProducts =
    sortBy === "bestseller" &&
    dataBestSeller?.getAdminDashboardStats?.topSellingProducts
      ? [...dataBestSeller.getAdminDashboardStats.topSellingProducts]
          .sort((a, b) => b.total_quantity - a.total_quantity) // Sắp xếp theo số lượng bán giảm dần
          .map((item: TopSellingProduct) => {
            // Tìm sản phẩm tương ứng trong danh sách sản phẩm đã lọc
            const matchingProduct = filteredBySearch.find(
              (product: Product) =>
                product.product_id.toString() === item.product_id
            );

            // Nếu tìm thấy sản phẩm, trả về sản phẩm đó với thông tin đầy đủ
            if (matchingProduct) {
              return matchingProduct;
            }

            // Nếu không tìm thấy, tạo một sản phẩm mới từ dữ liệu topSellingProduct
            return {
              product_id: Number(item.product_id),
              product_name: item.product_name,
              product_images: item.product.product_images,
              product_variations: [],
              total_sales: item.total_quantity,
            };
          })
          // Lọc lại để chỉ giữ những sản phẩm thỏa mãn điều kiện tìm kiếm
          .filter(
            (product: Product) =>
              !searchTerm ||
              product.product_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
          )
      : sortedProducts;

  // Tính toán tổng số trang
  const totalPages = Math.ceil(
    (data?.products?.totalCount || 0) / itemsPerPage
  );

  // Xử lý chuyển trang
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/customer/category/product?${params.toString()}`);
  };

  // Tạo mảng các số trang để hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      {/* Breadcrumb section */}
      <div className="mb-6 flex items-center text-sm text-gray-500 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
        <button
          onClick={navigateToHome}
          className="hover:text-brand-start transition-colors font-medium"
        >
          Trang chủ
        </button>
        <span className="mx-3 text-gray-300">/</span>
        <span className="font-medium text-gray-800">Sản phẩm</span>
        
        {categoryName && (
          <>
            <span className="mx-3 text-gray-300">/</span>
            <span className="text-brand-start font-medium">{categoryName}</span>
          </>
        )}
        {searchTerm && (
          <>
            <span className="mx-3 text-gray-300">/</span>
            <span className="text-gray-600">Tìm kiếm: <span className="font-semibold text-gray-900">"{searchTerm}"</span></span>
          </>
        )}
        {sortParam === "foryou" && (
          <>
            <span className="mx-3 text-gray-300">/</span>
            <span className="text-brand-start font-medium">Dành cho bạn</span>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        
        {/* Sort & Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-[67px] z-30 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Sort Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap mr-2">Sắp xếp:</span>
              
              {[
                { label: "Mới nhất", value: "newest" },
                { label: "Bán chạy", value: "bestseller" },
                ...(user ? [{ label: "Dành cho bạn", value: "foryou" }] : [])
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    const newSort = option.value as SortOption;
                    setSortBy(newSort);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("sort", newSort);
                    if (newSort === "foryou" && user) params.set("userId", user.user_id);
                    router.push(`/customer/category/product?${params.toString()}`);
                  }}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${sortBy === option.value 
                      ? "bg-brand-gradient text-white shadow-md transform scale-105" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Price Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative group w-full sm:w-48">
                <select
                  id="price-filter"
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-brand-start/20 focus:border-brand-start transition-all cursor-pointer text-sm font-medium"
                  value={sortBy.includes("price") ? sortBy : ""}
                  onChange={(e) => {
                    const newSortBy = e.target.value as SortOption;
                    if(newSortBy) {
                      setSortBy(newSortBy);
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("sort", newSortBy);
                      router.push(`/customer/category/product?${params.toString()}`);
                    }
                  }}
                >
                  <option value="" disabled hidden>Giá</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="min-h-[400px]">
          {loading ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {Array(10).fill(null).map((_, index) => (
                <div key={index} className="bg-white rounded-2xl p-4 shadow-sm space-y-3 animate-pulse border border-gray-100">
                  <div className="h-40 bg-gray-100 rounded-xl w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-2xl border border-red-100">
              <p className="text-red-500 font-medium">Không thể tải dữ liệu sản phẩm</p>
              <button onClick={() => window.location.reload()} className="mt-4 text-sm text-red-600 underline">Thử lại</button>
            </div>
          ) : finalProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {finalProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 hover:text-brand-start'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`
                      w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${currentPage === page 
                        ? 'bg-brand-gradient text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-50'}
                    `}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 hover:text-brand-start'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
