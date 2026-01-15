"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_VOUCHERS } from "@/graphql/queries";
import Vouchers from "@/app/components/layout/Vouchers";
import { Ticket } from "lucide-react";

interface Voucher {
  id: number;
  code: string;
  discount_percent: number;
  minimum_require_price: number;
  max_discount_price: number;
  valid_to: string;
  delete_at: string | null;
  create_at: string;
}

interface VouchersResponse {
  vouchers: {
    totalCount: number;
    totalPage: number;
    data: Voucher[];
  };
}

const VoucherPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8; // Increased items for grid layout

  const { data, loading, error } = useQuery<VouchersResponse>(GET_VOUCHERS, {
    variables: {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: "",
    },
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Valid vouchers filter
  const validVouchers = data?.vouchers.data
    .filter(voucher => !voucher.delete_at && new Date(voucher.valid_to) > new Date())
    .sort((a, b) => new Date(b.create_at).getTime() - new Date(a.create_at).getTime()) || [];

  const totalPages = data?.vouchers.totalPage || 1;

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-end/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-start/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-gradient rounded-full flex items-center justify-center mb-4 shadow-lg shadow-brand-start/30">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Kho Voucher</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Khám phá các mã giảm giá độc quyền dành cho bạn. Lưu lại và sử dụng ngay để mua sắm tiết kiệm hơn!
          </p>
        </div>
      </div>

      {/* Vouchers Grid */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
             {Array(6).fill(null).map((_, index) => (
                <div key={index} className="h-32 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse"></div>
             ))}
          </div>
        ) : error ? (
           <div className="text-center py-12 text-red-500 bg-red-50 rounded-xl">
             Đã xảy ra lỗi khi tải mã giảm giá. Vui lòng thử lại sau.
           </div>
        ) : validVouchers.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
             <div className="text-gray-400 mb-2">Không tìm thấy voucher nào</div>
             <p className="text-sm text-gray-500">Hãy quay lại sau nhé!</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {validVouchers.map((voucher) => (
              <div key={voucher.id} className="transform transition-all duration-300 hover:-translate-y-1">
                <Vouchers passedVouchers={[voucher]} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
             <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 hover:text-brand-start'}`}
              >
               &lt;
              </button>
              
              <span className="px-4 text-sm font-medium text-gray-700">
                 Trang {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 hover:text-brand-start'}`}
              >
               &gt;
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherPage;
