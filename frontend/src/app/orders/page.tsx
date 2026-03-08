"use client";

import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
import { useQuery } from "@tanstack/react-query";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { orderApi } from "@/lib/api/services";
import { formatDate, formatPrice } from "@/lib/utils";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-orders-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-orders-sans",
});

const steps = ["Pending", "Confirmed", "Shipped", "Delivered"] as const;

function getStepIndex(status: string) {
  const index = steps.findIndex((step) => step === status);
  return index < 0 ? 0 : index;
}

export default function OrdersPage() {
  const canRender = useRequireAuth();

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders,
    queryFn: orderApi.list,
    enabled: canRender,
  });

  if (!canRender) return null;

  const orders = ordersQuery.data ?? [];

  return (
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-orders-sans)]`}
    >
      <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
        <section className="space-y-3">
          <h1 className="text-5xl text-[#241d18] [font-family:var(--font-orders-serif)] sm:text-6xl">My Orders</h1>
          <p className="text-[#7b6f68]">Track all your purchases and delivery progress.</p>
          <div className="h-[2px] w-24 bg-[#C4714F]" />
        </section>

        {ordersQuery.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-3xl bg-[#eee1d6]" />
            ))}
          </div>
        ) : null}

        {ordersQuery.isError ? (
          <section className="rounded-3xl bg-white p-8 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h2 className="text-3xl text-[#2d251f] [font-family:var(--font-orders-serif)]">Could not load orders</h2>
            <p className="mt-2 text-[#7b6f68]">Please retry. If the issue continues, log in again.</p>
            <button
              type="button"
              onClick={() => ordersQuery.refetch()}
              className="mt-5 inline-flex rounded-full bg-[#C4714F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342]"
            >
              Retry
            </button>
          </section>
        ) : null}

        {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 ? (
          <section className="rounded-3xl bg-white p-8 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h2 className="text-3xl text-[#2d251f] [font-family:var(--font-orders-serif)]">No orders yet</h2>
            <p className="mt-2 text-[#7b6f68]">Orders you place will appear here.</p>
            <Link
              href="/shop"
              className="mt-5 inline-flex rounded-full bg-[#C4714F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342]"
            >
              Explore Frames
            </Link>
          </section>
        ) : null}

        {!ordersQuery.isLoading && orders.length > 0 ? (
          <section className="space-y-4">
            {orders.map((order) => {
              const stepIndex = getStepIndex(order.status);
              const isCancelled = order.status === "Cancelled";

              return (
                <article key={order.id} className="rounded-3xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-2xl text-[#2d251f] [font-family:var(--font-orders-serif)]">Order #{order.id}</h3>
                      <p className="mt-1 text-sm text-[#8b7d74]">Placed on {formatDate(order.created_at)}</p>
                    </div>
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
                          <div className={`h-1.5 rounded-full ${active ? "bg-[#C4714F]" : "bg-[#efe2d8]"}`} />
                          <p className={`text-xs ${active ? "text-[#8d4c31]" : "text-[#aa9c93]"}`}>{step}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#efe2d7] pt-4">
                    <p className="text-sm text-[#5f5048]">Total: {formatPrice(order.total_amount)}</p>
                    <Link
                      href={`/orders/${order.id}`}
                      className="rounded-full border border-[#d8c8bb] px-4 py-2 text-sm font-medium text-[#5a4c43] transition hover:border-[#C4714F] hover:text-[#C4714F]"
                    >
                      View details
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}
      </div>
    </div>
  );
}

