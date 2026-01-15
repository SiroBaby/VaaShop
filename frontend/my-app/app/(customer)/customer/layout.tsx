"use client";
import "@/app/globals.css";
//import { useState, useEffect } from "react";
import AnotherTopBar from "@/app/components/layout/AnotherTopBar";
//import ProductCategory from "@/app/components/layout/ProductCategory";
import Footer from "@/app/components/layout/Footer";
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AnotherTopBar />

      <div className="pb-2">{children}</div>

      <div className=" pt-0">
        <Footer />
      </div>
    </div>
  );
}
