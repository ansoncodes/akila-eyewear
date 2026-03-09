"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Inter, Playfair_Display } from "next/font/google";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { orderApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatDate, formatPrice } from "@/lib/utils";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-order-detail-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-order-detail-sans",
});

const steps = ["Pending", "Confirmed", "Shipped", "Delivered"] as const;

function getStepIndex(status: string) {
  const index = steps.findIndex((step) => step === status);
  return index < 0 ? 0 : index;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const canRender = useRequireAuth();
  const isValidOrderId = Number.isFinite(orderId) && orderId > 0;

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => orderApi.detail(orderId),
    enabled: canRender && isValidOrderId,
  });

  const paymentQuery = useQuery({
    queryKey: ["payment", orderId],
    queryFn: () => orderApi.payment(orderId),
    enabled: canRender && isValidOrderId,
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

  const cancelMutation = useMutation({
    mutationFn: () => orderApi.cancel(orderId),
    onSuccess: () => {
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: (error: unknown) => {
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Could not cancel order";
      toast.error(detail);
    },
  });

  if (!canRender) return null;

  const order = orderQuery.data;
  if (!order) {
    return (
      <div
        className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-order-detail-sans)]`}
      >
      <div className="mx-auto w-full max-w-[1380px] px-4 pb-16 pt-28 sm:px-8 lg:px-12">
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h1 className="text-3xl text-[#2d251f] [font-family:var(--font-order-detail-serif)]">Order unavailable</h1>
            <p className="mt-2 text-[#7b6f68]">Could not load this order.</p>
            <Link
              href="/orders"
              className="mt-5 inline-flex rounded-full bg-[#C4714F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342]"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "Cancelled";
  const stepIndex = getStepIndex(order.status);
  const paymentStatus = paymentQuery.data?.status ?? order.payment.status;
  const canPayNow = order.status === "Pending" && paymentStatus !== "Paid";
  const canCancelOrder = order.status === "Pending" || order.status === "Confirmed";

  return (
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-order-detail-sans)]`}
    >
      <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
        <section className="space-y-3">
          <h1 className="text-5xl text-[#241d18] [font-family:var(--font-order-detail-serif)] sm:text-6xl">Order #{order.id}</h1>
          <p className="text-[#7b6f68]">Placed on {formatDate(order.created_at)}</p>
          <div className="h-[2px] w-24 bg-[#C4714F]" />
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-order-detail-serif)]">Order Progress</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isCancelled ? "bg-[#f9e2d8] text-[#a26143]" : "bg-[#f7e7de] text-[#C4714F]"
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {steps.map((step, index) => {
              const active = !isCancelled && index <= stepIndex;
              return (
                <div key={step} className="space-y-2">
                  <div className={`h-1.5 rounded-full ${active ? "bg-[#C4714F]" : "bg-[#efe2d7]"}`} />
                  <p className={`text-xs ${active ? "text-[#8d4c31]" : "text-[#aa9c93]"}`}>{step}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-8">
          <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-order-detail-serif)]">Items</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-[#efe2d7] pb-3 text-sm text-[#5f5048]">
                <span>
                  {item.product_name} x {item.quantity}
                </span>
                <span>{formatPrice(Number(item.price_at_purchase) * item.quantity)}</span>
              </div>
            ))}
            <p className="pt-2 text-base font-semibold text-[#2f2621]">Total: {formatPrice(order.total_amount)}</p>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-order-detail-serif)]">Shipping</h2>
            <div className="mt-4 space-y-1.5 text-sm text-[#5f5048]">
              <p>{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.phone}</p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 ? <p>{order.shipping_address.address_line2}</p> : null}
              <p>
                {order.shipping_address.city}, {order.shipping_address.state}, {order.shipping_address.pincode}
              </p>
              <p>{order.shipping_address.country}</p>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-order-detail-serif)]">Payment</h2>
            <div className="mt-4 space-y-1.5 text-sm text-[#5f5048]">
              <p>Status: {paymentStatus}</p>
              <p>Method: {paymentQuery.data?.payment_method ?? order.payment.payment_method}</p>
              <p>Amount: {formatPrice(order.total_amount)}</p>
              <p>Transaction: {paymentQuery.data?.transaction_id || order.payment.transaction_id || "Not paid"}</p>
            </div>

            {canPayNow ? (
              <button
                onClick={() => payMutation.mutate()}
                disabled={payMutation.isPending || paymentStatus === "Paid"}
                className="mt-4 rounded-full bg-[#C4714F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {payMutation.isPending ? "Processing..." : "Pay Now"}
              </button>
            ) : null}

            {canCancelOrder ? (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending || payMutation.isPending}
                className="mt-3 rounded-full border border-[#d7c5b8] px-4 py-2.5 text-sm font-semibold text-[#5a4a40] transition hover:border-[#C4714F] hover:text-[#C4714F] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Cancel Order"}
              </button>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

