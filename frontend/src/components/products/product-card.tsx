"use client";

import Link from "next/link";

import { formatPrice, imageUrl } from "@/lib/utils";
import type { Product } from "@/types/api";

export default function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images.find((item) => item.is_primary)?.image || product.images[0]?.image;
  const displayPrice = product.discount_price ?? product.price;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 transition hover:-translate-y-1 hover:border-slate-600">
      <Link href={`/product/${product.id}`}>
        <div className="aspect-[4/3] w-full bg-slate-800">
          {primaryImage ? (
            <img
              src={imageUrl(primaryImage)}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
          )}
        </div>
      </Link>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white">{product.name}</h3>
          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{product.gender}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">{formatPrice(displayPrice)}</span>
          {product.discount_price ? (
            <span className="text-sm text-slate-400 line-through">{formatPrice(product.price)}</span>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Link
            href={`/product/${product.id}`}
            className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-center text-sm text-white hover:border-white"
          >
            Details
          </Link>
          <Link
            href={`/try-on/${product.id}`}
            className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-sm font-semibold text-slate-950"
          >
            Try On
          </Link>
        </div>
      </div>
    </article>
  );
}
