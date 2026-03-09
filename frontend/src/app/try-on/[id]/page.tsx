"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Inter, Playfair_Display } from "next/font/google";
import { useQuery } from "@tanstack/react-query";

import VirtualTryOn from "@/components/try-on/virtual-try-on";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/api/query-keys";
import { productsApi } from "@/lib/api/services";
import { formatPrice } from "@/lib/utils";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-tryon-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-tryon-sans",
});

export default function TryOnPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const isValidProductId = Number.isFinite(productId) && productId > 0;

  const productQuery = useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => productsApi.detail(productId),
    enabled: isValidProductId,
  });

  if (productQuery.isLoading) {
    return (
      <div
        className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-tryon-sans)]`}
      >
      <div className="mx-auto w-full max-w-[1380px] space-y-6 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
          <Skeleton className="h-10 w-44 rounded-full bg-[#eee1d6]" />
          <Skeleton className="h-[600px] rounded-3xl bg-[#eee1d6]" />
        </div>
      </div>
    );
  }

  if (!productQuery.data || !isValidProductId) {
    return (
      <div
        className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-tryon-sans)]`}
      >
      <div className="mx-auto w-full max-w-[1380px] px-4 pb-16 pt-28 sm:px-8 lg:px-12">
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h1 className="text-3xl text-[#2d251f] [font-family:var(--font-tryon-serif)]">Try-on unavailable</h1>
            <p className="mt-2 text-[#7b6f68]">Could not load the selected product.</p>
            <Link
              href="/shop"
              className="mt-5 inline-flex rounded-full bg-[#C4714F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342]"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const product = productQuery.data;

  return (
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-tryon-sans)]`}
    >
      <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[#a19085]">Virtual Try-On</p>
          <h1 className="text-5xl text-[#241d18] [font-family:var(--font-tryon-serif)] sm:text-6xl">Try {product.name}</h1>
          <p className="text-[#7b6f68]">Move your face naturally and keep your eyes centered for best fit.</p>
          <div className="h-[2px] w-24 bg-[#C4714F]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4 rounded-3xl bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-6">
            <VirtualTryOn model={product.glasses_model} />
          </div>

          <aside className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-tryon-serif)]">{product.name}</h2>
            <p className="text-sm text-[#7b6f68]">{product.description || "No description available."}</p>
            <p className="text-3xl font-semibold text-[#2f2621]">{formatPrice(product.discount_price ?? product.price)}</p>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#f7e7de] px-3 py-1 text-[#C4714F]">{product.gender}</span>
              <span className="rounded-full bg-[#f3ece4] px-3 py-1 text-[#7c6c63]">Category #{product.category ?? "-"}</span>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                href={`/product/${productId}`}
                className="block rounded-full border border-[#d8c8bb] px-4 py-2.5 text-center text-sm font-semibold text-[#5a4c43] transition hover:border-[#C4714F] hover:text-[#C4714F]"
              >
                Back to Product
              </Link>
              <Link
                href="/shop"
                className="block rounded-full bg-[#C4714F] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#b66342]"
              >
                Browse More Frames
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

