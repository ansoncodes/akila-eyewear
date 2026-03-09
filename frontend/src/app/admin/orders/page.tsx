"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import AdminErrorState from "@/components/admin/error-state";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminModal from "@/components/admin/modal";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { queryClient } from "@/lib/query-client";
import { formatDate, formatPrice } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui-store";
import type { AdminOrder, AdminPayment } from "@/types/admin";

const orderStatuses: AdminOrder["status"][] = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

const fieldClass =
  "rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129] placeholder:text-[#a18f84] focus:border-[#d9b8a5] focus:outline-none focus:ring-2 focus:ring-[#edd6c8]";

function warmStatusClass(value: string) {
  const key = value.toLowerCase();
  if (key === "pending") return "bg-[#f7e7de] text-[#a76040]";
  if (key === "confirmed" || key === "shipped") return "bg-[#f2ece5] text-[#6b594f]";
  if (key === "delivered" || key === "paid" || key === "success") return "bg-[#e9f5ee] text-[#2d7d55]";
  if (key === "cancelled" || key === "failed") return "bg-[#fce9e9] text-[#b34848]";
  return "bg-[#f2ece5] text-[#6b594f]";
}

export default function AdminOrdersPage() {
  const globalSearch = useAdminUiStore((state) => state.globalSearch);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedPaymentOrderId, setSelectedPaymentOrderId] = useState<number | null>(null);

  const ordersQuery = useQuery({
    queryKey: queryKeys.adminOrders(),
    queryFn: () => adminApi.orders(),
  });

  const paymentsQuery = useQuery({
    queryKey: queryKeys.adminPayments(),
    queryFn: () => adminApi.payments(),
  });

  const paymentDetailQuery = useQuery({
    queryKey: selectedPaymentOrderId ? queryKeys.adminPayment(selectedPaymentOrderId) : ["admin-payment-idle"],
    queryFn: () => adminApi.paymentDetail(selectedPaymentOrderId!),
    enabled: Boolean(selectedPaymentOrderId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AdminOrder["status"] }) => adminApi.updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders() });
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
    },
    onError: () => toast.error("Unable to update order status"),
  });

  const filteredOrders = useMemo(() => {
    return (ordersQuery.data ?? []).filter((order) => {
      const created = new Date(order.created_at).getTime();
      const matchesSearch = globalSearch
        ? `${order.id} ${order.status} ${order.total_amount}`.toLowerCase().includes(globalSearch.toLowerCase())
        : true;
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      const matchesPayment = paymentFilter ? order.payment?.status === paymentFilter : true;
      const matchesFrom = dateFrom ? created >= new Date(`${dateFrom}T00:00:00`).getTime() : true;
      const matchesTo = dateTo ? created <= new Date(`${dateTo}T23:59:59`).getTime() : true;
      return matchesSearch && matchesStatus && matchesPayment && matchesFrom && matchesTo;
    });
  }, [ordersQuery.data, globalSearch, statusFilter, paymentFilter, dateFrom, dateTo]);

  const filteredPayments = useMemo(() => {
    return (paymentsQuery.data ?? []).filter((payment) => {
      const matchesSearch = globalSearch
        ? `${payment.order_id ?? ""} ${payment.payment_method} ${payment.transaction_id ?? ""}`
            .toLowerCase()
            .includes(globalSearch.toLowerCase())
        : true;
      const matchesStatus = paymentFilter ? payment.status === paymentFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [paymentsQuery.data, globalSearch, paymentFilter]);

  if (ordersQuery.isLoading || paymentsQuery.isLoading) {
    return <AdminLoadingState label="Loading orders and payments..." />;
  }

  if (ordersQuery.isError || paymentsQuery.isError) {
    return <AdminErrorState description="Unable to load orders or payments." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-[#241d18] [font-family:var(--font-heading),serif]">Orders & Payments</h1>
        <p className="mt-1 text-sm text-[#7b6f68]">Track order lifecycle, shipping and payment records.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#ece2d9] bg-white p-3 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={fieldClass}
        >
          <option value="">All Order Statuses</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(event) => setPaymentFilter(event.target.value)}
          className={fieldClass}
        >
          <option value="">All Payment Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Failed">Failed</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className={fieldClass}
        />

        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#ece2d9] bg-white shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-[#f7efe8]">
              <tr>
                {["Order", "Customer", "Total", "Payment", "Status", "Update", "Actions"].map((label) => (
                  <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8f88]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#8a7c73]">
                    No orders match current filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((row) => (
                  <tr key={row.id} className="border-t border-[#efe3d9] align-top transition hover:bg-[#fcf8f4]">
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <div>
                        <p className="font-medium text-[#2f2621]">#{row.id}</p>
                        <p className="text-xs text-[#8a7c73]">{formatDate(row.created_at)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">User #{row.user}</td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">{formatPrice(row.total_amount)}</td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${warmStatusClass(row.payment?.status ?? "Pending")}`}>
                        {row.payment?.status ?? "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${warmStatusClass(row.status)}`}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <select
                        value={row.status}
                        onChange={(event) =>
                          updateStatusMutation.mutate({
                            id: row.id,
                            status: event.target.value as AdminOrder["status"],
                          })
                        }
                        className="rounded-lg border border-[#e6d6c9] bg-white px-2 py-1 text-xs text-[#3d3129]"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <Link
                        href={`/admin/orders/${row.id}`}
                        className="rounded-lg border border-[#ddc9bb] bg-white px-2.5 py-1 text-xs text-[#6b594f] hover:bg-[#f8eee7]"
                      >
                        View Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#2f2621]">Payment Records</h2>
        <div className="overflow-hidden rounded-2xl border border-[#ece2d9] bg-white shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse text-left">
              <thead className="bg-[#f7efe8]">
                <tr>
                  {["Order", "Amount", "Method", "Status", "Created", "Actions"].map((label) => (
                    <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8f88]">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#8a7c73]">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((row: AdminPayment) => (
                    <tr key={`${row.order_id}-${row.created_at}`} className="border-t border-[#efe3d9] align-top transition hover:bg-[#fcf8f4]">
                      <td className="px-4 py-3 text-sm text-[#3a312b]">#{row.order_id}</td>
                      <td className="px-4 py-3 text-sm text-[#3a312b]">{formatPrice(row.amount)}</td>
                      <td className="px-4 py-3 text-sm text-[#3a312b]">{row.payment_method}</td>
                      <td className="px-4 py-3 text-sm text-[#3a312b]">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${warmStatusClass(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#3a312b]">
                        <span className="text-xs text-[#8a7c73]">{formatDate(row.created_at)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#3a312b]">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentOrderId(row.order_id ?? null)}
                          className="rounded-lg border border-[#ddc9bb] bg-white px-2.5 py-1 text-xs text-[#6b594f] hover:bg-[#f8eee7]"
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminModal
        open={Boolean(selectedPaymentOrderId)}
        onClose={() => setSelectedPaymentOrderId(null)}
        title="Payment Detail"
        tone="warm"
      >
        {paymentDetailQuery.isLoading ? <AdminLoadingState label="Loading payment detail..." /> : null}
        {paymentDetailQuery.isError ? <AdminErrorState description="Unable to fetch payment detail." /> : null}
        {paymentDetailQuery.data ? (
          <div className="space-y-2 text-sm text-[#3a312b]">
            <p>
              <span className="text-[#8a7c73]">Order:</span> #{paymentDetailQuery.data.order_id}
            </p>
            <p>
              <span className="text-[#8a7c73]">Amount:</span> {formatPrice(paymentDetailQuery.data.amount)}
            </p>
            <p>
              <span className="text-[#8a7c73]">Status:</span> {paymentDetailQuery.data.status}
            </p>
            <p>
              <span className="text-[#8a7c73]">Method:</span> {paymentDetailQuery.data.payment_method}
            </p>
            <p>
              <span className="text-[#8a7c73]">Transaction:</span> {paymentDetailQuery.data.transaction_id || "N/A"}
            </p>
            <p>
              <span className="text-[#8a7c73]">Created:</span> {formatDate(paymentDetailQuery.data.created_at)}
            </p>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}

