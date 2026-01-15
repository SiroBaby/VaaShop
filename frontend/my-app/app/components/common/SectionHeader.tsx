import React from "react";
import Link from "next/link";
import Image from "next/image";

interface SectionHeaderProps {
  title: string;
  iconSrc?: string;
  linkHref?: string;
  linkText?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  iconSrc,
  linkHref,
  linkText = "Xem tất cả",
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
      <div className="flex items-center gap-3">
        {iconSrc && (
          <div className="relative w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand/20">
            <Image
              src={iconSrc}
              alt=""
              width={20}
              height={20}
              className="object-contain brightness-0 invert"
            />
          </div>
        )}
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
          {title}
        </h2>
      </div>
      
      {linkHref && (
        <Link
          href={linkHref}
          className="group flex items-center text-sm font-medium text-brand-end hover:text-brand-start transition-colors"
        >
          {linkText}
          <svg
            className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
