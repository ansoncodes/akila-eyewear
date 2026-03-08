"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import ProductModelViewer from "@/components/products/product-model-viewer";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/api/query-keys";
import { cartApi, productsApi, reviewApi, wishlistApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatDate, formatPrice, imageUrl } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => Boolean(state.accessToken));

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const productQuery = useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => productsApi.detail(productId),
    enabled: Number.isFinite(productId),
  });

  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews(productId),
    queryFn: () => reviewApi.list(productId),
    enabled: Number.isFinite(productId),
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

  const primaryImage = useMemo(() => {
    const product = productQuery.data;
    if (!product) return "";
    return product.images.find((item) => item.is_primary)?.image || product.images[0]?.image || "";
  }, [productQuery.data]);

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-[520px]" />
      </div>
    );
  }

  if (!productQuery.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState title="Product unavailable" description="The selected product could not be loaded." />
      </div>
    );
  }

  const product = productQuery.data;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            {primaryImage ? (
              <img src={imageUrl(primaryImage)} alt={product.name} className="h-[500px] w-full object-cover" />
            ) : (
              <div className="flex h-[500px] items-center justify-center text-slate-400">No image</div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {product.images.slice(0, 3).map((img) => (
              <div key={img.id} className="overflow-hidden rounded-lg border border-slate-800">
                <img src={imageUrl(img.image)} alt={product.name} className="h-24 w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h1 className="text-4xl text-white">{product.name}</h1>
          <p className="text-slate-300">{product.description}</p>
          <p className="text-3xl font-semibold text-white">{formatPrice(product.discount_price ?? product.price)}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-800 px-3 py-1">{product.gender}</span>
            <span className="rounded-full bg-slate-800 px-3 py-1">Category #{product.category ?? "-"}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => addCartMutation.mutate()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Add to Cart
            </button>
            <button
              onClick={() => addWishlistMutation.mutate()}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm"
            >
              Add to Wishlist
            </button>
            <Link href={`/try-on/${product.id}`} className="rounded-lg border border-cyan-400 px-4 py-2 text-center text-sm">
              Try On Live
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl text-white">3D Preview</h2>
        <ProductModelViewer model={product.glasses_model} />
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl text-white">Reviews</h2>

        {isLoggedIn ? (
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-300">Rating</label>
              <select
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
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
              className="h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              onClick={() => createReviewMutation.mutate()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Submit Review
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-300">Login to post a review.</p>
        )}

        <div className="space-y-3">
          {reviewsQuery.data?.map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white">{review.user_email}</p>
                <p className="text-sm text-slate-300">{formatDate(review.created_at)}</p>
              </div>
              <p className="mt-1 text-sm text-amber-300">Rating: {review.rating}/5</p>
              <p className="mt-2 text-sm text-slate-200">{review.comment || "No comment"}</p>
              {user && review.user === user.id ? (
                <button
                  onClick={() => removeReviewMutation.mutate(review.id)}
                  className="mt-3 text-sm text-rose-300"
                >
                  Delete
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
