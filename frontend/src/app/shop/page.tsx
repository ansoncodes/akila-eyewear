"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Glasses } from "lucide-react";
import { Inter, Playfair_Display } from "next/font/google";

import ProductCard from "@/components/products/product-card";
import ProductFilters from "@/components/products/product-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/api/query-keys";
import { productsApi } from "@/lib/api/services";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-shop-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-shop-sans",
});

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export default function ShopPage() {
  const [filters, setFilters] = useState<{
    search?: string;
    category?: string;
    collection?: string;
    frame_shape?: string;
    gender?: string;
    min_price?: string;
    max_price?: string;
  }>({});

  const productParams = useMemo(() => {
    const params: Record<string, string | number> = {};

    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = Number(filters.category);
    if (filters.collection) params.collection = Number(filters.collection);
    if (filters.frame_shape) params.frame_shape = Number(filters.frame_shape);
    if (filters.gender) params.gender = filters.gender;
    if (filters.min_price) params.min_price = Number(filters.min_price);
    if (filters.max_price) params.max_price = Number(filters.max_price);

    return params;
  }, [filters]);

  const productsQuery = useQuery({
    queryKey: queryKeys.products(productParams),
    queryFn: () => productsApi.list(productParams),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: productsApi.categories,
  });

  const collectionsQuery = useQuery({
    queryKey: queryKeys.collections,
    queryFn: productsApi.collections,
  });

  const frameShapesQuery = useQuery({
    queryKey: queryKeys.frameShapes,
    queryFn: productsApi.frameShapes,
  });

  return (
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-shop-sans)]`}
    >
      <div className="mx-auto w-full max-w-[1380px] px-4 pb-16 pt-28 sm:px-8 lg:px-12">
        <section className="mb-10">
          <h1 className="text-5xl text-[#241d18] [font-family:var(--font-shop-serif)] sm:text-6xl">Shop Frames</h1>
          <p className="mt-3 text-[#7b6f68]">Find your perfect pair</p>
          <div className="mt-4 h-[2px] w-24 bg-[#C4714F]" />
        </section>

        <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
          <ProductFilters
            categories={categoriesQuery.data ?? []}
            collections={collectionsQuery.data ?? []}
            frameShapes={frameShapesQuery.data ?? []}
            filters={filters}
            onChange={setFilters}
          />

          <section className="space-y-6">
            {productsQuery.isLoading ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-[390px] rounded-2xl bg-[#eee4db]" />
                ))}
              </div>
            ) : null}

            {!productsQuery.isLoading && (productsQuery.data?.length ?? 0) === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl bg-transparent text-center">
                <Glasses className="h-14 w-14 text-[#c8b4a8]" strokeWidth={1.4} />
                <p className="text-[#7b6f68]">No frames found. Try adjusting your filters.</p>
              </div>
            ) : null}

            <motion.div
              variants={listVariants}
              initial="hidden"
              animate={productsQuery.isLoading ? "hidden" : "show"}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {productsQuery.data?.map((product, index) => (
                <motion.div key={product.id} variants={cardVariants}>
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </div>
      </div>
    </div>
  );
}

