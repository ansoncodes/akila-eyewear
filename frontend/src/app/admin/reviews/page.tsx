"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import DataTable from "@/components/admin/data-table";
import AdminErrorState from "@/components/admin/error-state";
import FilterBar from "@/components/admin/filter-bar";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminModal from "@/components/admin/modal";
import AdminPageHeader from "@/components/admin/page-header";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { queryClient } from "@/lib/query-client";
import { formatDate } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui-store";
import type { AdminReview } from "@/types/admin";

export default function AdminReviewsPage() {
  const globalSearch = useAdminUiStore((state) => state.globalSearch);
  const [ratingFilter, setRatingFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);

  const reviewsQuery = useQuery({
    queryKey: queryKeys.adminReviews({ product: productFilter }),
    queryFn: () => adminApi.reviews(productFilter ? { product: Number(productFilter) } : undefined),
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.adminProducts(),
    queryFn: () => adminApi.products(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteReview(id),
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminReviews() });
    },
    onError: () => toast.error("Unable to delete review"),
  });

  const productMap = useMemo(() => {
    const map = new Map<number, string>();
    (productsQuery.data ?? []).forEach((product) => map.set(product.id, product.name));
    return map;
  }, [productsQuery.data]);

  const filtered = useMemo(() => {
    return (reviewsQuery.data ?? []).filter((review) => {
      const created = new Date(review.created_at).getTime();
      const matchesGlobal = globalSearch
        ? `${review.user_email} ${review.comment}`.toLowerCase().includes(globalSearch.toLowerCase())
        : true;
      const matchesRating = ratingFilter ? review.rating === Number(ratingFilter) : true;
      const matchesProduct = productFilter ? review.product === Number(productFilter) : true;
      const matchesFrom = dateFrom ? created >= new Date(`${dateFrom}T00:00:00`).getTime() : true;
      const matchesTo = dateTo ? created <= new Date(`${dateTo}T23:59:59`).getTime() : true;
      return matchesGlobal && matchesRating && matchesProduct && matchesFrom && matchesTo;
    });
  }, [reviewsQuery.data, globalSearch, ratingFilter, productFilter, dateFrom, dateTo]);

  if (reviewsQuery.isLoading || productsQuery.isLoading) {
    return <AdminLoadingState label="Loading reviews..." />;
  }

  if (reviewsQuery.isError || productsQuery.isError) {
    return <AdminErrorState description="Unable to load review moderation data." />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Reviews Moderation" subtitle="Inspect customer feedback and moderate content quality." />

      <FilterBar>
        <select
          value={ratingFilter}
          onChange={(event) => setRatingFilter(event.target.value)}
          className="rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129]"
        >
          <option value="">All Ratings</option>
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </select>

        <select
          value={productFilter}
          onChange={(event) => setProductFilter(event.target.value)}
          className="rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129]"
        >
          <option value="">All Products</option>
          {(productsQuery.data ?? []).map((product) => (
            <option key={product.id} value={String(product.id)}>
              {product.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129]"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className="rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129]"
        />
      </FilterBar>

      <DataTable
        columns={[
          {
            key: "user",
            label: "Customer",
            render: (row) => <span>{row.user_email}</span>,
          },
          {
            key: "product",
            label: "Product",
            render: (row) => <span>{productMap.get(row.product) ?? `#${row.product}`}</span>,
          },
          {
            key: "rating",
            label: "Rating",
            render: (row) => <span>{row.rating}/5</span>,
          },
          {
            key: "comment",
            label: "Comment",
            render: (row) => <p className="max-w-[280px] text-xs">{row.comment || "No comment"}</p>,
          },
          {
            key: "date",
            label: "Date",
            render: (row) => <span className="text-xs">{formatDate(row.created_at)}</span>,
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReview(row)}
                  className="rounded-lg border border-[#ddc9bb] bg-white px-2 py-1 text-xs text-[#6b594f] hover:bg-[#f8eee7]"
                >
                  View
                </button>
                <button
                  type="button"
                  disabled
                  title="Visibility field is not available in backend"
                  className="cursor-not-allowed rounded-lg border border-[#e6d6c9] bg-[#f7efe8] px-2 py-1 text-xs text-[#a18f84]"
                >
                  Visibility N/A
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(row.id)}
                  className="rounded-lg border border-[#f0cfcd] bg-[#fdf2f2] px-2 py-1 text-xs text-[#b34848] hover:bg-[#fae5e5]"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={filtered}
        rowKey={(row) => row.id}
        emptyLabel="No reviews found."
      />

      <AdminModal open={Boolean(selectedReview)} onClose={() => setSelectedReview(null)} title="Review Detail" tone="warm">
        {selectedReview ? (
          <div className="space-y-2 text-sm text-[#3a312b]">
            <p>
              <span className="text-[#8a7c73]">Customer:</span> {selectedReview.user_email}
            </p>
            <p>
              <span className="text-[#8a7c73]">Product:</span> {productMap.get(selectedReview.product) ?? `#${selectedReview.product}`}
            </p>
            <p>
              <span className="text-[#8a7c73]">Rating:</span> {selectedReview.rating}/5
            </p>
            <p>
              <span className="text-[#8a7c73]">Created:</span> {formatDate(selectedReview.created_at)}
            </p>
            <p className="rounded-xl border border-[#ece2d9] bg-white p-3">{selectedReview.comment || "No comment"}</p>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}

