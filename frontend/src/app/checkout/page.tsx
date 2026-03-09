"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Inter, Playfair_Display } from "next/font/google";
import toast from "react-hot-toast";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { authApi, cartApi, orderApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-checkout-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-checkout-sans",
});

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
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [shipping, setShipping] = useState(initialAddress);
  const [shippingTouched, setShippingTouched] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [pendingPayment, setPendingPayment] = useState<{
    orderId: number;
    amount: number;
    method: string;
  } | null>(null);

  const cartQuery = useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartApi.get,
    enabled: canRender,
  });

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled: canRender,
  });

  const profileHasAddress = useMemo(() => {
    const user = meQuery.data;
    if (!user) return false;
    return Boolean(
      user.phone?.trim() ||
        user.address_line1?.trim() ||
        user.address_line2?.trim() ||
        user.city?.trim() ||
        user.state?.trim() ||
        user.pincode?.trim() ||
        user.country?.trim()
    );
  }, [meQuery.data]);

  useEffect(() => {
    const user = meQuery.data;
    if (!user || shippingTouched) return;

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();

    setShipping({
      full_name: fullName,
      phone: user.phone ?? "",
      address_line1: user.address_line1 ?? "",
      address_line2: user.address_line2 ?? "",
      city: user.city ?? "",
      state: user.state ?? "",
      pincode: user.pincode ?? "",
      country: user.country ?? "",
    });
  }, [meQuery.data, shippingTouched]);

  const createOrderMutation = useMutation({
    mutationFn: () =>
      orderApi.create({
        payment_method: paymentMethod,
        shipping_address: shipping,
      }),
    onSuccess: async (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(order.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });

      if (!profileHasAddress) {
        try {
          const updatedUser = await authApi.updateProfile({
            phone: shipping.phone,
            address_line1: shipping.address_line1,
            address_line2: shipping.address_line2,
            city: shipping.city,
            state: shipping.state,
            pincode: shipping.pincode,
            country: shipping.country,
          });
          setUser(updatedUser);
          queryClient.invalidateQueries({ queryKey: queryKeys.me });
          toast.success("Shipping address saved to profile");
        } catch {
          toast.error("Order placed, but could not save address to profile");
        }
      }

      if (paymentMethod === "COD") {
        toast.success("Order placed with Cash on Delivery");
        router.push("/orders");
        return;
      }

      setPendingPayment({
        orderId: order.id,
        amount: Number(order.total_amount),
        method: paymentMethod,
      });
      toast.success("Order created. Complete payment to confirm.");
    },
    onError: (error: unknown) => {
      const data = (error as { response?: { data?: Record<string, string[] | string> } })?.response?.data;
      if (data && typeof data === "object") {
        const [field, messages] = Object.entries(data)[0] ?? [];
        const firstMessage = Array.isArray(messages) ? messages[0] : messages;
        if (field && firstMessage) {
          toast.error(`${field}: ${firstMessage}`);
          return;
        }
      }
      toast.error("Could not create order");
    },
  });

  const payMutation = useMutation({
    mutationFn: (orderId: number) => orderApi.pay(orderId),
    onSuccess: () => {
      toast.success("Payment successful");
      if (pendingPayment) {
        queryClient.invalidateQueries({ queryKey: queryKeys.order(pendingPayment.orderId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      router.push("/orders");
    },
    onError: () => toast.error("Payment failed"),
  });

  if (!canRender) return null;

  const items = cartQuery.data?.items ?? [];
  const total = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);

  if (items.length === 0 && !pendingPayment) {
    return (
      <div
        className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-checkout-sans)]`}
      >
      <div className="mx-auto w-full max-w-[1380px] px-4 pb-16 pt-28 sm:px-8 lg:px-12">
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h1 className="text-3xl text-[#2d251f] [font-family:var(--font-checkout-serif)]">No items to checkout</h1>
            <p className="mt-2 text-[#7b6f68]">Add items to cart before placing an order.</p>
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

  return (
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-checkout-sans)]`}
    >
      <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
        <section className="space-y-3">
          <h1 className="text-5xl text-[#241d18] [font-family:var(--font-checkout-serif)] sm:text-6xl">Checkout</h1>
          <p className="text-[#7b6f68]">Confirm shipping details and place your order.</p>
          <div className="h-[2px] w-24 bg-[#C4714F]" />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <form
            className="space-y-5 rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              createOrderMutation.mutate();
            }}
          >
            <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-checkout-serif)]">Shipping Address</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(shipping).map(([key, value]) => (
                <input
                  key={key}
                  value={value}
                  required={key !== "address_line2"}
                  onChange={(event) => {
                    setShippingTouched(true);
                    setShipping((prev) => ({ ...prev, [key]: event.target.value }));
                  }}
                  placeholder={key.replaceAll("_", " ")}
                  className="rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm text-[#2a241f] outline-none transition focus:border-[#C4714F]"
                />
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm text-[#2a241f] outline-none transition focus:border-[#C4714F]"
              >
                <option value="COD">COD</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={createOrderMutation.isPending || payMutation.isPending || Boolean(pendingPayment)}
              className="rounded-full bg-[#C4714F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createOrderMutation.isPending
                ? "Placing..."
                : paymentMethod === "COD"
                  ? "Place Order"
                  : "Place & Continue to Payment"}
            </button>
          </form>

          <aside className="space-y-4 rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-checkout-serif)]">Summary</h2>
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm text-[#5f5048]">
                <span>
                  {item.product_name} x {item.quantity}
                </span>
                <span>{formatPrice(Number(item.unit_price) * item.quantity)}</span>
              </div>
            ))}

            <div className="border-t border-[#eee1d6] pt-3 text-base font-semibold text-[#2f2621]">
              Total: {formatPrice(total)}
            </div>

            {pendingPayment ? (
              <div className="space-y-2 rounded-2xl bg-[#fbf3ea] p-4">
                <p className="text-sm text-[#8d4c31]">Order #{pendingPayment.orderId} created.</p>
                <p className="text-sm text-[#7b6f68]">Method: {pendingPayment.method}</p>
                <p className="text-sm text-[#7b6f68]">Amount: {formatPrice(pendingPayment.amount)}</p>
                <button
                  onClick={() => payMutation.mutate(pendingPayment.orderId)}
                  disabled={payMutation.isPending}
                  className="w-full rounded-full bg-[#C4714F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {payMutation.isPending ? "Processing..." : "Pay Now"}
                </button>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

