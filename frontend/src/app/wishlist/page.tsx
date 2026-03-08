"use client";

import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import { Inter, Playfair_Display } from "next/font/google";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { wishlistApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatPrice } from "@/lib/utils";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-wishlist-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-wishlist-sans",
});

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
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-wishlist-sans)]`}
    >
      <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
        <section className="space-y-3">
          <h1 className="text-5xl text-[#241d18] [font-family:var(--font-wishlist-serif)] sm:text-6xl">Wishlist</h1>
          <p className="text-[#7b6f68]">Save frames you love and come back anytime.</p>
          <div className="h-[2px] w-24 bg-[#C4714F]" />
        </section>

        {wishlistQuery.isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                <div className="h-28 animate-pulse bg-[#f4ece3]" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#efe5db]" />
                  <div className="h-4 w-1/3 animate-pulse rounded-full bg-[#efe5db]" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!wishlistQuery.isLoading && items.length === 0 ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-3xl bg-white/50 px-6 text-center shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <Heart className="h-14 w-14 text-[#d0b5a8]" strokeWidth={1.4} />
            <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-wishlist-serif)]">Your wishlist is empty</h2>
            <p className="max-w-md text-[#7b6f68]">Save products to compare and decide later.</p>
            <Link
              href="/shop"
              className="mt-1 rounded-full bg-[#C4714F] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#b66342]"
            >
              Explore Frames
            </Link>
          </section>
        ) : null}

        {!wishlistQuery.isLoading && items.length > 0 ? (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-center justify-between bg-[#fbf3ea] px-5 py-3">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#a68774]">Saved Item</span>
                  <Sparkles className="h-4 w-4 text-[#C4714F]" strokeWidth={1.5} />
                </div>

                <div className="space-y-3 p-5">
                  <h3 className="text-lg font-medium text-[#2c241f]">{item.product_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-[#2f2621]">{formatPrice(item.discount_price ?? item.price)}</span>
                    {item.discount_price ? (
                      <span className="text-sm text-[#ad9f95] line-through">{formatPrice(item.price)}</span>
                    ) : null}
                  </div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#ab9d93]">
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/product/${item.product}`}
                      className="flex-1 rounded-full border border-[#d8c8bb] px-3 py-2 text-center text-sm font-medium text-[#5a4c43] transition hover:border-[#C4714F] hover:text-[#C4714F]"
                    >
                      View Product
                    </Link>
                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      disabled={removeMutation.isPending}
                      className="flex-1 rounded-full bg-[#C4714F] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}

