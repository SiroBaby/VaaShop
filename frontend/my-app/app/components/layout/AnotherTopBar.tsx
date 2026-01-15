"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import { useApolloClient, useLazyQuery } from "@apollo/client";
import {
  GET_CART,
  GET_CART_PRODUCTS,
  GET_PRODUCTS,
  GET_USER_BY_ID,
} from "@/graphql/queries";
import { debounce } from "lodash";
import { Search, ShoppingCart, Bell, Menu, Globe, HelpCircle, Store } from "lucide-react";

interface Product {
  product_id: number;
  product_name: string;
  product_images: Array<{
    image_url: string;
    is_thumbnail: boolean;
  }>;
  product_variations: Array<{
    base_price: number;
    percent_discount: number;
  }>;
  category: {
    category_name: string;
  };
  shop: {
    shop_name: string;
  };
}

const AnotherTopBar = () => {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const apolloClient = useApolloClient();
  const [userName, setUserName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const [executeSearch, { loading }] = useLazyQuery(GET_PRODUCTS);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setUserName(`${user.firstName} ${user.lastName}`);
    }
  }, [user]);

  const handleClickSellerChennel = async () => {
    if (userId) {
      try {
        const { data: userData } = await apolloClient.query({
          query: GET_USER_BY_ID,
          variables: { id: userId },
          fetchPolicy: "network-only",
        });

        if (userData?.user?.role === "seller") {
          router.push("/seller/dashboard");
        } else if (userData?.user?.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/customer/create-shop");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/customer/create-shop");
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const debouncedSearch = debounce(async (term: string) => {
    if (term.length >= 2) {
      try {
        const { data } = await executeSearch({
          variables: {
            page: 1,
            limit: 10,
            search: term,
          },
        });

        const uniqueProducts =
          data?.products?.data
            ?.filter(
              (product: Product, index: number, self: Product[]) =>
                index ===
                self.findIndex(
                  (p: Product) => p.product_name === product.product_name
                )
            )
            .slice(0, 5) || [];

        setSuggestions(uniqueProducts);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error searching products:", error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, 900);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(
        `/customer/category/product?search=${encodeURIComponent(searchTerm)}`
      );
    }
  };

  const handleSuggestionClick = (product: Product) => {
    router.push(
      `/customer/category/product?search=${encodeURIComponent(
        product.product_name
      )}`
    );
    setShowSuggestions(false);
    setSearchTerm("");
    setSuggestions([]);
  };

  const handleCartClick = async () => {
    if (userId) {
      try {
        await apolloClient.cache.evict({ fieldName: "getcart" });
        await apolloClient.cache.evict({ fieldName: "getCartProducts" });
        await apolloClient.cache.gc();

        const { data: cartData } = await apolloClient.query({
          query: GET_CART,
          variables: { id: userId },
          fetchPolicy: "network-only",
        });

        if (cartData?.getcart?.cart_id) {
          await apolloClient.query({
            query: GET_CART_PRODUCTS,
            variables: { cart_id: cartData.getcart.cart_id },
            fetchPolicy: "network-only",
          });
        }

        router.push(`/customer/shoppingcart/${userId}`);
      } catch (error) {
        console.error("Error refreshing cart data:", error);
        router.push(`/customer/shoppingcart/${userId}`);
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all duration-300">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3 w-full md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px]">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Logo & Seller Channel - Flex-1 to push center items */}
          <div className="flex-1 flex items-center justify-start gap-4 xl:gap-8 min-w-0">
            <div 
              className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
              onClick={() => router.push("/")}
            >
              <Image
                src="/logo/logodemo.png"
                width={120}
                height={35}
                alt="VaaShop"
                className="object-contain h-9 w-auto"
                priority
              />
            </div>
            
            <span
              onClick={handleClickSellerChennel}
              className="cursor-pointer text-sm font-medium text-gray-600 hover:text-brand-start transition-colors whitespace-nowrap hidden xl:block truncate"
            >
              Kênh Người Bán
            </span>
          </div>

          {/* Center: Search Bar - Fixed max-width, strictly centered */}
          <div className="w-full max-w-3xl px-4 shrink-0" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative group w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-start transition-colors" />
                <input
                  type="text"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-full pl-10 pr-10 py-2.5 outline-none transition-all duration-300 focus:bg-white focus:border-brand-start focus:ring-1 focus:ring-brand-start/50 focus:shadow-md placeholder:text-gray-400"
                  placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-gradient rounded-full text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
                {loading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Đang tải...</div>
                ) : (
                  <div>
                     <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
                      Gợi ý
                    </div>
                    {suggestions.map((product) => (
                      <div
                        key={product.product_id}
                        className="px-4 py-2.5 hover:bg-surface-subtle cursor-pointer flex items-center justify-between group transition-colors"
                        onClick={() => handleSuggestionClick(product)}
                      >
                         <div className="font-medium text-gray-700 group-hover:text-brand-start text-sm truncate">
                           {product.product_name}
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions & User - Flex-1 to balance Left */}
          <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
             {user ? (
                <div className="flex items-center gap-2 justify-end">
                  <span 
                    className="font-semibold text-sm cursor-pointer truncate max-w-[120px] hidden lg:block hover:text-brand-start text-right"
                    onClick={() => router.push(`/customer/user/profile/${userId}`)}
                  >
                    {userName}
                  </span>
                   <UserButton afterSignOutUrl="/"/>
                </div>
             ) : (
               <div className="flex items-center gap-3 text-sm font-medium justify-end">
                 <button onClick={() => router.push("/sign-in")} className="hover:text-brand-start whitespace-nowrap">
                   Đăng nhập
                 </button>
                 <span className="text-gray-300">/</span>
                 <button onClick={() => router.push("/sign-up")} className="hover:text-brand-start whitespace-nowrap">
                   Đăng ký
                 </button>
               </div>
             )}

            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            <button 
               className="p-2.5 text-gray-600 hover:text-brand-start hover:bg-gray-50 rounded-full transition-all relative group"
               aria-label="Giỏ hàng"
               onClick={handleCartClick}
            >
               <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnotherTopBar;
