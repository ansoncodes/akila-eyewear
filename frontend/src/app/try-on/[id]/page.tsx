"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import VirtualTryOn from "@/components/try-on/virtual-try-on";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/api/query-keys";
import { productsApi } from "@/lib/api/services";

export default function TryOnPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);

  const productQuery = useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => productsApi.detail(productId),
    enabled: Number.isFinite(productId),
  });

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!productQuery.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState title="Try-on unavailable" description="Could not load the selected product." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl text-white">Virtual Try-On</h1>
          <p className="text-slate-300">{productQuery.data.name}</p>
        </div>
        <Link href={`/product/${productId}`} className="rounded-lg border border-slate-700 px-4 py-2 text-sm">
          Back to Product
        </Link>
      </div>

      <VirtualTryOn model={productQuery.data.glasses_model} />
    </div>
  );
}
