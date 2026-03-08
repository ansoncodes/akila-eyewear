"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { EmptyState } from "@/components/ui/empty-state";
import { queryKeys } from "@/lib/api/query-keys";
import { cartApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatPrice } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function CartPage() {
  const canRender = useRequireAuth();

  const cartQuery = useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartApi.get,
    enabled: canRender,
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) => cartApi.update(itemId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
    onError: () => toast.error("Could not update quantity"),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => cartApi.remove(itemId),
    onSuccess: () => {
      toast.success("Item removed");
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
    onError: () => toast.error("Could not remove item"),
  });

  if (!canRender) {
    return null;
  }

  const items = cartQuery.data?.items ?? [];
  const total = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl text-white">My Cart</h1>

      {items.length === 0 ? (
        <EmptyState title="Cart is empty" description="Add frames from the shop to continue." />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div>
                <h3 className="font-semibold text-white">{item.product_name}</h3>
                <p className="text-sm text-slate-300">{formatPrice(item.unit_price)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                  className="h-8 w-8 rounded border border-slate-700"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                  className="h-8 w-8 rounded border border-slate-700"
                >
                  +
                </button>
              </div>

              <button onClick={() => removeMutation.mutate(item.id)} className="text-sm text-rose-300">
                Remove
              </button>
            </article>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-lg text-white">Total: {formatPrice(total)}</p>
            <Link href="/checkout" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
