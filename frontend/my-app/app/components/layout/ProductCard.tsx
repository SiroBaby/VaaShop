/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductImage {
  image_url: string;
  is_thumbnail: boolean;
}

interface ProductVariation {
  base_price: number;
  percent_discount: number;
}

interface Product {
  product_id: number;
  product_name: string;
  product_images: ProductImage[];
  product_variations: ProductVariation[];
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // Get price information from the first variation
  const variation = product.product_variations[0] || {};
  const originalPrice = variation.base_price;
  const discountPercent = variation.percent_discount || 0;

  // Get image URL (thumbnail or first image) with fallback
  const thumbnailImage = product.product_images?.find(
    (img) => img?.is_thumbnail
  );
  const fallbackImageUrl = "/icon/null.png"; // Default fallback image
  const imageUrl =
    thumbnailImage?.image_url ||
    product.product_images?.[0]?.image_url ||
    fallbackImageUrl;

  return (
    <Link href={`/customer/details/product/${product.product_id}`} className="block h-full">
      <div
        className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand/30"
        onMouseLeave={() => {
          setIsButtonPressed(false);
        }}
      >
        <div className="relative aspect-[1/1] w-full bg-gray-50 overflow-hidden">
          <Image
            src={imageUrl}
            fill
            alt={product.product_name || "Product image"}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          {discountPercent > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
              -{Math.round(discountPercent * 100)}%
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-gray-800 font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-brand-end transition-colors">
            {product.product_name}
          </h3>
          
          <div className="mt-auto">
            {discountPercent > 0 ? (
              <div className="flex flex-col">
                <p className="text-gray-400 line-through text-xs mb-0.5">
                  {originalPrice?.toLocaleString()} ₫
                </p>
                <p className="text-brand-start font-bold text-lg">
                  {(
                    (originalPrice || 0) -
                    (originalPrice || 0) * discountPercent
                  ).toLocaleString()} <span className="text-xs">₫</span>
                </p>
              </div>
            ) : (
              <p className="text-brand-start font-bold text-lg">
                {originalPrice?.toLocaleString()} <span className="text-xs">₫</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
