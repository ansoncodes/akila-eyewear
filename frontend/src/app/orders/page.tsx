"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { orderApi } from "@/lib/api/services";
import { formatDate, formatPrice } from "@/lib/utils";

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
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl text-white">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Orders you place will appear here." />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">Order #{order.id}</h3>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{order.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-300">{formatDate(order.created_at)}</p>
              <p className="mt-1 text-sm text-slate-100">Total: {formatPrice(order.total_amount)}</p>
              <Link href={`/orders/${order.id}`} className="mt-3 inline-block text-sm text-cyan-300">
                View details
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
