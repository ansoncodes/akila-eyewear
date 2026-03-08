"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Inter, Playfair_Display } from "next/font/google";
import toast from "react-hot-toast";

import ProductModelViewer from "@/components/products/product-model-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/api/query-keys";
import { cartApi, productsApi, reviewApi, wishlistApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatDate, formatPrice, imageUrl } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-product-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-product-sans",
});

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const isValidProductId = Number.isFinite(productId) && productId > 0;
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => Boolean(state.accessToken));

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [activeImageId, setActiveImageId] = useState<number | null>(null);

  const productQuery = useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => productsApi.detail(productId),
    enabled: isValidProductId,
  });

  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews(productId),
    queryFn: () => reviewApi.list(productId),
    enabled: isValidProductId,
  });

  const addCartMutation = useMutation({
    mutationFn: () => cartApi.add(productId, 1),
    onSuccess: () => {
      toast.success("Added to cart");
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
    onError: () => toast.error("Login as customer to add cart items"),
  });

  const addWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.add(productId),
    onSuccess: () => {
      toast.success("Added to wishlist");
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
    },
    onError: () => toast.error("Login as customer to add wishlist items"),
  });

  const createReviewMutation = useMutation({
    mutationFn: () => reviewApi.create({ product: productId, rating, comment }),
    onSuccess: () => {
      toast.success("Review submitted");
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(productId) });
    },
    onError: () => toast.error("Could not submit review"),
  });

  const removeReviewMutation = useMutation({
    mutationFn: (reviewId: number) => reviewApi.remove(reviewId),
    onSuccess: () => {
      toast.success("Review removed");
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(productId) });
    },
    onError: () => toast.error("Could not remove review"),
  });

  useEffect(() => {
    if (!productQuery.data?.images?.length) return;
    if (!activeImageId) {
      const primary = productQuery.data.images.find((item) => item.is_primary)?.id ?? productQuery.data.images[0].id;
      setActiveImageId(primary);
    }
  }, [productQuery.data, activeImageId]);

  const activeImage = useMemo(() => {
    const product = productQuery.data;
    if (!product) return "";
    if (activeImageId) {
      const selected = product.images.find((item) => item.id === activeImageId)?.image;
      if (selected) return selected;
    }
    return product.images.find((item) => item.is_primary)?.image || product.images[0]?.image || "";
  }, [productQuery.data, activeImageId]);

  if (productQuery.isLoading) {
    return (
      <div
        className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-product-sans)]`}
      >
      <div className="mx-auto w-full max-w-[1380px] space-y-6 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
          <Skeleton className="h-10 w-44 rounded-full bg-[#eee1d6]" />
          <Skeleton className="h-[580px] rounded-3xl bg-[#eee1d6]" />
        </div>
      </div>
    );
  }

  if (!productQuery.data || !isValidProductId) {
    return (
      <div
        className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-product-sans)]`}
      >
      <div className="mx-auto w-full max-w-[1380px] px-4 pb-16 pt-28 sm:px-8 lg:px-12">
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h1 className="text-3xl text-[#2d251f] [font-family:var(--font-product-serif)]">Product unavailable</h1>
            <p className="mt-2 text-[#7b6f68]">The selected product could not be loaded.</p>
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
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-product-sans)]`}
    >
      <div className="mx-auto w-full max-w-[1380px] space-y-10 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[#a19085]">Shop / Product</p>
          <h1 className="text-5xl text-[#241d18] [font-family:var(--font-product-serif)] sm:text-6xl">{product.name}</h1>
          <div className="h-[2px] w-24 bg-[#C4714F]" />
        </section>

        <section className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              {activeImage ? (
                <img src={imageUrl(activeImage)} alt={product.name} className="h-[520px] w-full object-contain bg-[#fbf7f2] p-8" />
              ) : (
                <div className="flex h-[520px] items-center justify-center text-[#9b8d84]">No image</div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {product.images.map((img) => (
                <button
                  type="button"
                  key={img.id}
                  onClick={() => setActiveImageId(img.id)}
                  className={`overflow-hidden rounded-xl border bg-white transition ${
                    activeImageId === img.id ? "border-[#C4714F]" : "border-[#e7d8cc]"
                  }`}
                >
                  <img src={imageUrl(img.image)} alt={product.name} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-8">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.16em] text-[#a08f84]">{product.gender}</p>
              <p className="text-[#65564d]">{product.description || "No description available."}</p>
            </div>

            <div className="flex items-end gap-3">
              <p className="text-4xl font-semibold text-[#2f2621]">{formatPrice(product.discount_price ?? product.price)}</p>
              {product.discount_price ? (
                <p className="pb-1 text-lg text-[#ab9e95] line-through">{formatPrice(product.price)}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#f7e7de] px-3 py-1 text-[#C4714F]">Category #{product.category ?? "-"}</span>
              <span className="rounded-full bg-[#f3ece4] px-3 py-1 text-[#7c6c63]">Collection #{product.collection ?? "-"}</span>
              <span className="rounded-full bg-[#f3ece4] px-3 py-1 text-[#7c6c63]">Shape #{product.frame_shape ?? "-"}</span>
              <span className="rounded-full bg-[#f3ece4] px-3 py-1 text-[#7c6c63]">Material #{product.frame_material ?? "-"}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => addCartMutation.mutate()}
                disabled={addCartMutation.isPending}
                className="rounded-full bg-[#C4714F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Add to Cart
              </button>
              <button
                onClick={() => addWishlistMutation.mutate()}
                disabled={addWishlistMutation.isPending}
                className="rounded-full border border-[#d8c8bb] px-4 py-2.5 text-sm font-semibold text-[#5a4c43] transition hover:border-[#C4714F] hover:text-[#C4714F] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Add to Wishlist
              </button>
              <Link
                href={`/try-on/${product.id}`}
                className="rounded-full border border-[#d8c8bb] px-4 py-2.5 text-center text-sm font-semibold text-[#5a4c43] transition hover:border-[#C4714F] hover:text-[#C4714F] sm:col-span-2"
              >
                Try On Live
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-4xl text-[#241d18] [font-family:var(--font-product-serif)]">3D Preview</h2>
          <ProductModelViewer model={product.glasses_model} />
        </section>

        <section className="space-y-5">
          <h2 className="text-4xl text-[#241d18] [font-family:var(--font-product-serif)]">Reviews</h2>

          {isLoggedIn ? (
            <div className="space-y-3 rounded-3xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#6f6158]">Rating</label>
                <select
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                  className="rounded-full border border-[#e0d2c5] bg-[#fffdfb] px-3 py-2 text-sm text-[#2f2621] outline-none"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Write your feedback"
                className="h-24 w-full rounded-2xl border border-[#e0d2c5] bg-[#fffdfb] px-3 py-2 text-sm text-[#2f2621] outline-none"
              />
              <button
                onClick={() => createReviewMutation.mutate()}
                disabled={createReviewMutation.isPending}
                className="rounded-full bg-[#C4714F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Submit Review
              </button>
            </div>
          ) : (
            <p className="rounded-2xl bg-white p-4 text-sm text-[#7b6f68] shadow-[0_2px_16px_rgba(0,0,0,0.04)]">Login to post a review.</p>
          )}

          {reviewsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-2xl bg-[#eee1d6]" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {reviewsQuery.data?.length ? (
                reviewsQuery.data.map((review) => (
                  <article key={review.id} className="rounded-2xl bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[#2f2621]">{review.user_email}</p>
                      <p className="text-sm text-[#8b7c73]">{formatDate(review.created_at)}</p>
                    </div>
                    <p className="mt-1 text-sm text-[#C4714F]">Rating: {review.rating}/5</p>
                    <p className="mt-2 text-sm text-[#4f423a]">{review.comment || "No comment"}</p>
                    {user && review.user === user.id ? (
                      <button
                        onClick={() => removeReviewMutation.mutate(review.id)}
                        disabled={removeReviewMutation.isPending}
                        className="mt-3 text-sm text-[#a26143] transition hover:text-[#8d4c31] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Delete
                      </button>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="rounded-2xl bg-white p-4 text-sm text-[#7b6f68] shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                  No reviews yet. Be the first to review this frame.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

