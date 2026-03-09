"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import AdminErrorState from "@/components/admin/error-state";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminPageHeader from "@/components/admin/page-header";
import AdminPanel from "@/components/admin/panel";
import StatusBadge from "@/components/admin/status-badge";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { queryClient } from "@/lib/query-client";
import { formatDate, formatPrice } from "@/lib/utils";
import type { AdminOrder } from "@/types/admin";

const orderStatuses: AdminOrder["status"][] = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();

  const orderQuery = useQuery({
    queryKey: queryKeys.adminOrder(params.id),
    queryFn: () => adminApi.orderDetail(params.id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: AdminOrder["status"]) => adminApi.updateOrderStatus(Number(params.id), status),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrder(params.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders() });
    },
    onError: () => toast.error("Unable to update order status"),
  });

  if (orderQuery.isLoading) {
    return <AdminLoadingState label="Loading order detail..." />;
  }

  if (orderQuery.isError || !orderQuery.data) {
    return <AdminErrorState description="Unable to load order detail." />;
  }

  const order = orderQuery.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={`Order #${order.id}`} subtitle={`Created ${formatDate(order.created_at)}`} />

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminPanel className="xl:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-[#2f2621]">Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#ece2d9] bg-white p-3">
                <p className="text-sm text-[#2f2621]">{item.product_name}</p>
                <p className="mt-1 text-xs text-[#8a7c73]">Qty: {item.quantity}</p>
                <p className="mt-1 text-xs text-[#6b594f]">Price at purchase: {formatPrice(item.price_at_purchase)}</p>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="mb-3 text-lg font-semibold text-[#2f2621]">Status</h2>
          <div className="space-y-3">
            <StatusBadge value={order.status} />
            <select
              value={order.status}
              onChange={(event) => statusMutation.mutate(event.target.value as AdminOrder["status"])}
              className="w-full rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129]"
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <p className="text-sm text-[#8a7c73]">Total: {formatPrice(order.total_amount)}</p>
            <p className="text-sm text-[#8a7c73]">Customer ID: {order.user}</p>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel>
          <h2 className="mb-3 text-lg font-semibold text-[#2f2621]">Shipping Address</h2>
          {order.shipping_address ? (
            <div className="space-y-1 text-sm text-[#4f423a]">
              <p>{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.phone}</p>
              <p>{order.shipping_address.address_line1}</p>
              <p>{order.shipping_address.address_line2}</p>
              <p>
                {order.shipping_address.city}, {order.shipping_address.state}
              </p>
              <p>
                {order.shipping_address.pincode}, {order.shipping_address.country}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#8a7c73]">Shipping address unavailable.</p>
          )}
        </AdminPanel>

        <AdminPanel>
          <h2 className="mb-3 text-lg font-semibold text-[#2f2621]">Payment</h2>
          {order.payment ? (
            <div className="space-y-1 text-sm text-[#4f423a]">
              <p>Amount: {formatPrice(order.payment.amount)}</p>
              <p>Status: {order.payment.status}</p>
              <p>Method: {order.payment.payment_method}</p>
              <p>Transaction: {order.payment.transaction_id || "N/A"}</p>
              <p>Created: {formatDate(order.payment.created_at)}</p>
            </div>
          ) : (
            <p className="text-sm text-[#8a7c73]">Payment info unavailable.</p>
          )}
        </AdminPanel>
      </div>

      <AdminPanel>
        <h2 className="mb-3 text-lg font-semibold text-[#2f2621]">Timeline</h2>
        <div className="space-y-2 text-sm text-[#4f423a]">
          <p>Order created: {formatDate(order.created_at)}</p>
          <p>Current status: {order.status}</p>
          <p>Payment status: {order.payment?.status ?? "Pending"}</p>
          <p className="text-xs text-[#8a7c73]">Detailed event timeline endpoint is pending integration.</p>
        </div>
      </AdminPanel>
    </div>
  );
}

