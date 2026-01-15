"use client";
import "@/app/globals.css";
//import { useState, useEffect } from "react";
//import AnotherTopBar from "@/app/components/layout/AnotherTopBar";
import ProductCategory from "@/app/components/layout/ProductCategory";
//import Footer from "@/app/components/layout/Footer";
//import FilterSidebar from "@/app/components/layout/FilterSidebar";
//import LoadingScreen from "@/app/components/LoadingScreen";
//import { useRouter } from "next/navigation";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  //const [isLoading, setIsLoading] = useState(true);
  //const router = useRouter();
  /*
  const handleCategoryClick = (path: string) => {
    router.push(path);
  };
 
  useEffect(() => {
    // Simulate loading time for components
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }*/

  return (
    <div className="flex-1 w-full bg-surface-subtle min-h-screen">
      <main className="w-full md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <ProductCategory />
        </div>
        <div className="fade-in">{children}</div>
      </main>
    </div>
  );
}
