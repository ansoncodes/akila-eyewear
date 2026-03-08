"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { EmptyState } from "@/components/ui/empty-state";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { cartApi, orderApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatPrice } from "@/lib/utils";

const initialAddress = {
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "",
};

export default function CheckoutPage() {
  const canRender = useRequireAuth();
  const [shipping, setShipping] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  const cartQuery = useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartApi.get,
    enabled: canRender,
  });

  const createOrderMutation = useMutation({
    mutationFn: () =>
      orderApi.create({
        payment_method: paymentMethod,
        shipping_address: shipping,
      }),
    onSuccess: (order) => {
      setCreatedOrderId(order.id);
      toast.success("Order created");
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
    onError: () => toast.error("Could not create order"),
  });

  const payMutation = useMutation({
    mutationFn: (orderId: number) => orderApi.pay(orderId),
    onSuccess: () => {
      toast.success("Payment successful");
      if (createdOrderId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.order(createdOrderId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: () => toast.error("Payment failed"),
  });

  if (!canRender) return null;

  const items = cartQuery.data?.items ?? [];
  const total = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);

  if (items.length === 0 && !createdOrderId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState title="No items to checkout" description="Add items to cart before placing an order." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl text-white">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            createOrderMutation.mutate();
          }}
        >
          <h2 className="text-2xl text-white">Shipping Address</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(shipping).map(([key, value]) => (
              <input
                key={key}
                value={value}
                required={key !== "address_line2"}
                onChange={(event) => setShipping((prev) => ({ ...prev, [key]: event.target.value }))}
                placeholder={key.replaceAll("_", " ")}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="COD">COD</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950">
            Place Order
          </button>
        </form>

        <aside className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="text-2xl text-white">Summary</h2>
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm text-slate-300">
              <span>
                {item.product_name} x {item.quantity}
              </span>
              <span>{formatPrice(Number(item.unit_price) * item.quantity)}</span>
            </div>
          ))}

          <div className="border-t border-slate-700 pt-3 text-white">Total: {formatPrice(total)}</div>

          {createdOrderId ? (
            <div className="space-y-2">
              <p className="text-sm text-emerald-300">Order #{createdOrderId} created.</p>
              <button
                onClick={() => payMutation.mutate(createdOrderId)}
                className="w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Pay Now
              </button>
              <Link href={`/orders/${createdOrderId}`} className="block text-center text-sm text-slate-300 underline">
                View Order
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
