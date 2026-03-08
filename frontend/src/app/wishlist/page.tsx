"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { EmptyState } from "@/components/ui/empty-state";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { wishlistApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatPrice } from "@/lib/utils";

export default function WishlistPage() {
  const canRender = useRequireAuth();

  const wishlistQuery = useQuery({
    queryKey: queryKeys.wishlist,
    queryFn: wishlistApi.get,
    enabled: canRender,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => wishlistApi.remove(itemId),
    onSuccess: () => {
      toast.success("Removed from wishlist");
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
    },
    onError: () => toast.error("Could not remove item"),
  });

  if (!canRender) {
    return null;
  }

  const items = wishlistQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl text-white">Wishlist</h1>

      {items.length === 0 ? (
        <EmptyState title="Wishlist is empty" description="Save products to compare and decide later." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="text-lg font-semibold text-white">{item.product_name}</h3>
              <p className="text-sm text-slate-300">{formatPrice(item.discount_price ?? item.price)}</p>
              <div className="flex gap-2">
                <Link
                  href={`/product/${item.product}`}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100"
                >
                  View Product
                </Link>
                <button onClick={() => removeMutation.mutate(item.id)} className="rounded-lg px-3 py-2 text-sm text-rose-300">
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
