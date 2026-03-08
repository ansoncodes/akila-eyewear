"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import DataTable from "@/components/admin/data-table";
import AdminErrorState from "@/components/admin/error-state";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminPageHeader from "@/components/admin/page-header";
import AdminPanel from "@/components/admin/panel";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { formatDate, formatPrice } from "@/lib/utils";

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();

  const customerQuery = useQuery({
    queryKey: queryKeys.adminCustomer(params.id),
    queryFn: () => adminApi.customerDetail(params.id),
  });

  if (customerQuery.isLoading) {
    return <AdminLoadingState label="Loading customer detail..." />;
  }

  if (customerQuery.isError || !customerQuery.data) {
    return <AdminErrorState description="Unable to load customer detail." />;
  }

  const customer = customerQuery.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${customer.first_name} ${customer.last_name}`.trim() || customer.email}
        subtitle={`Customer #${customer.id}`}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminPanel>
          <h2 className="mb-3 text-lg font-semibold text-white">Profile</h2>
          <div className="space-y-1 text-sm text-slate-300">
            <p>Email: {customer.email}</p>
            <p>Role: {customer.role}</p>
            <p>Joined: {formatDate(customer.date_joined)}</p>
            <p>Last Login: {customer.last_login ? formatDate(customer.last_login) : "Never"}</p>
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="mb-3 text-lg font-semibold text-white">Engagement</h2>
          <div className="space-y-1 text-sm text-slate-300">
            <p>Total Orders: {customer.order_count}</p>
            <p>Total Spend: {formatPrice(customer.total_spend)}</p>
            <p>Total Reviews: {customer.review_count}</p>
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="mb-3 text-lg font-semibold text-white">Wishlist Summary</h2>
          <p className="text-sm text-slate-400">N/A</p>
          <p className="mt-1 text-xs text-slate-500">Admin wishlist aggregate endpoint is pending integration.</p>
        </AdminPanel>
      </div>

      <AdminPanel>
        <h2 className="mb-3 text-lg font-semibold text-white">Order History</h2>
        <DataTable
          columns={[
            {
              key: "id",
              label: "Order",
              render: (row) => <span>#{row.id}</span>,
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <span>{row.status}</span>,
            },
            {
              key: "total",
              label: "Total",
              render: (row) => <span>{formatPrice(row.total_amount)}</span>,
            },
            {
              key: "date",
              label: "Created",
              render: (row) => <span className="text-xs">{formatDate(row.created_at)}</span>,
            },
          ]}
          rows={customer.orders}
          rowKey={(row) => row.id}
          emptyLabel="No orders yet."
        />
      </AdminPanel>

      <AdminPanel>
        <h2 className="mb-3 text-lg font-semibold text-white">Reviews History</h2>
        <DataTable
          columns={[
            {
              key: "product",
              label: "Product",
              render: (row) => <span>#{row.product_id}</span>,
            },
            {
              key: "rating",
              label: "Rating",
              render: (row) => <span>{row.rating}/5</span>,
            },
            {
              key: "comment",
              label: "Comment",
              render: (row) => <span className="text-xs">{row.comment || "No comment"}</span>,
            },
            {
              key: "date",
              label: "Date",
              render: (row) => <span className="text-xs">{formatDate(row.created_at)}</span>,
            },
          ]}
          rows={customer.reviews}
          rowKey={(row) => row.id}
          emptyLabel="No reviews yet."
        />
      </AdminPanel>
    </div>
  );
}