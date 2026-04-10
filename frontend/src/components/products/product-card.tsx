"use client";

import Link from "next/link";

import { formatPrice, imageUrl } from "@/lib/utils";
import type { Product } from "@/types/api";

const fallbackImages = [
  "/images/zeelool-glasses-9nbzZ8ZimU0-unsplash.jpg",
  "/images/zeelool-glasses-eIE2Oikd4E0-unsplash.jpg",
];

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const primaryImage = product.images.find((item) => item.is_primary)?.image || product.images[0]?.image;
  const displayPrice = product.discount_price ?? product.price;
  const imageSrc = primaryImage ? imageUrl(primaryImage) : fallbackImages[index % fallbackImages.length];

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)]">
      <Link href={`/product/${product.id}`}>
        <div className="aspect-[4/3] w-full bg-[#fbf7f2] p-5">
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-contain mix-blend-multiply transition duration-300 group-hover:scale-[1.02]"
          />
        </div>
      </Link>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-medium text-[#2c241f]">{product.name}</h3>
          <span className="rounded-full bg-[#f6e3dc] px-2.5 py-1 text-[11px] text-[#C4714F]">{product.gender}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-[#2f2621]">{formatPrice(displayPrice)}</span>
          {product.discount_price ? (
            <span className="text-sm text-[#ad9f95] line-through">{formatPrice(product.price)}</span>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Link
            href={`/product/${product.id}`}
            className="flex-1 rounded-full border border-[#d8c8bb] px-3 py-2 text-center text-sm font-medium text-[#5a4c43] transition hover:border-[#C4714F] hover:text-[#C4714F]"
          >
            Details
          </Link>
          <Link
            href={`/try-on/${product.id}`}
            className="flex-1 rounded-full bg-[#C4714F] px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-[#b66342]"
          >
            Try On
          </Link>
        </div>
      </div>
    </article>
  );
}
