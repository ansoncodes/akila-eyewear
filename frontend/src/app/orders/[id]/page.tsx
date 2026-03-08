"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { EmptyState } from "@/components/ui/empty-state";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { orderApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatDate, formatPrice } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const canRender = useRequireAuth();

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => orderApi.detail(orderId),
    enabled: canRender && Number.isFinite(orderId),
  });

  const paymentQuery = useQuery({
    queryKey: ["payment", orderId],
    queryFn: () => orderApi.payment(orderId),
    enabled: canRender && Number.isFinite(orderId),
  });

  const payMutation = useMutation({
    mutationFn: () => orderApi.pay(orderId),
    onSuccess: () => {
      toast.success("Payment successful");
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      queryClient.invalidateQueries({ queryKey: ["payment", orderId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: () => toast.error("Payment failed"),
  });

  if (!canRender) return null;

  const order = orderQuery.data;
  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState title="Order unavailable" description="Could not load this order." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl text-white">Order #{order.id}</h1>
      <p className="text-sm text-slate-300">Placed on {formatDate(order.created_at)}</p>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h2 className="text-2xl text-white">Items</h2>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm text-slate-300">
              <span>
                {item.product_name} x {item.quantity}
              </span>
              <span>{formatPrice(Number(item.price_at_purchase) * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="text-2xl text-white">Shipping</h2>
          <p className="mt-3 text-sm text-slate-300">{order.shipping_address.full_name}</p>
          <p className="text-sm text-slate-300">{order.shipping_address.phone}</p>
          <p className="text-sm text-slate-300">{order.shipping_address.address_line1}</p>
          <p className="text-sm text-slate-300">{order.shipping_address.address_line2}</p>
          <p className="text-sm text-slate-300">
            {order.shipping_address.city}, {order.shipping_address.state}, {order.shipping_address.pincode}
          </p>
          <p className="text-sm text-slate-300">{order.shipping_address.country}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="text-2xl text-white">Payment</h2>
          <p className="mt-3 text-sm text-slate-300">Status: {paymentQuery.data?.status ?? "Pending"}</p>
          <p className="text-sm text-slate-300">Method: {paymentQuery.data?.payment_method ?? order.payment.payment_method}</p>
          <p className="text-sm text-slate-300">Amount: {formatPrice(order.total_amount)}</p>
          <p className="text-sm text-slate-300">
            Transaction: {paymentQuery.data?.transaction_id || order.payment.transaction_id || "Not paid"}
          </p>

          {order.status === "Pending" ? (
            <button
              onClick={() => payMutation.mutate()}
              className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Pay Now
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
