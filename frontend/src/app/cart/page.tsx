"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Inter, Playfair_Display } from "next/font/google";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { cartApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatPrice } from "@/lib/utils";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cart-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cart-sans",
});

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
  const isMutating = updateMutation.isPending || removeMutation.isPending;

  return (
    <div className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-cart-sans)]`}>
      <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
        <section className="space-y-3">
          <h1 className="text-5xl text-[#241d18] [font-family:var(--font-cart-serif)] sm:text-6xl">My Cart</h1>
          <p className="text-[#7b6f68]">Review your selected frames before checkout.</p>
          <div className="h-[2px] w-24 bg-[#C4714F]" />
        </section>

        {cartQuery.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                <div className="h-20 animate-pulse bg-[#f4ece3]" />
              </div>
            ))}
          </div>
        ) : null}

        {!cartQuery.isLoading && items.length === 0 ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-3xl bg-white/50 px-6 text-center shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <ShoppingBag className="h-14 w-14 text-[#d0b5a8]" strokeWidth={1.4} />
            <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-cart-serif)]">Your cart is empty</h2>
            <p className="max-w-md text-[#7b6f68]">Add frames from the shop to continue.</p>
            <Link
              href="/shop"
              className="mt-1 rounded-full bg-[#C4714F] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#b66342]"
            >
              Continue Shopping
            </Link>
          </section>
        ) : null}

        {!cartQuery.isLoading && items.length > 0 ? (
          <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
                >
                  <div className="min-w-[220px] flex-1">
                    <h3 className="text-lg font-medium text-[#2c241f]">{item.product_name}</h3>
                    <p className="mt-1 text-sm text-[#8f7f75]">{formatPrice(item.unit_price)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                      disabled={isMutating}
                      className="h-9 w-9 rounded-full border border-[#d8c8bb] text-lg text-[#6f5b50] transition hover:border-[#C4714F] hover:text-[#C4714F] disabled:cursor-not-allowed disabled:opacity-70"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-[#443831]">{item.quantity}</span>
                    <button
                      onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                      disabled={isMutating}
                      className="h-9 w-9 rounded-full border border-[#d8c8bb] text-lg text-[#6f5b50] transition hover:border-[#C4714F] hover:text-[#C4714F] disabled:cursor-not-allowed disabled:opacity-70"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    disabled={isMutating}
                    className="rounded-full border border-[#e2cfc0] px-4 py-2 text-sm font-medium text-[#a26143] transition hover:border-[#C4714F] hover:text-[#C4714F] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>

            <aside className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-cart-serif)]">Order Summary</h2>
              <div className="flex items-center justify-between border-b border-[#eee1d6] pb-3 text-sm text-[#7f6f65]">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-[#2f2621]">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link
                href="/checkout"
                className="block rounded-full bg-[#C4714F] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#b66342]"
              >
                Proceed to Checkout
              </Link>
            </aside>
          </section>
        ) : null}
      </div>
    </div>
  );
}

