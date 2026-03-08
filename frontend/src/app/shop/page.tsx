"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import ProductCard from "@/components/products/product-card";
import ProductFilters from "@/components/products/product-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/api/query-keys";
import { productsApi } from "@/lib/api/services";

export default function ShopPage() {
  const [filters, setFilters] = useState<{
    category?: string;
    collection?: string;
    frame_shape?: string;
    gender?: string;
    min_price?: string;
    max_price?: string;
  }>({});

  const productParams = useMemo(() => {
    const params: Record<string, string | number> = {};

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
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
      <ProductFilters
        categories={categoriesQuery.data ?? []}
        collections={collectionsQuery.data ?? []}
        frameShapes={frameShapesQuery.data ?? []}
        filters={filters}
        onChange={setFilters}
      />

      <section className="space-y-6">
        <SectionTitle title="Shop Frames" subtitle="Filter by category, silhouette, fit, and budget." />

        {productsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[360px]" />
            ))}
          </div>
        ) : null}

        {!productsQuery.isLoading && (productsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No matching products" description="Adjust filters to discover more frames." />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {productsQuery.data?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
