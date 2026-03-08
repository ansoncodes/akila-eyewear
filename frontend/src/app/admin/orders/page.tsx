"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import DataTable from "@/components/admin/data-table";
import AdminErrorState from "@/components/admin/error-state";
import FilterBar from "@/components/admin/filter-bar";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminModal from "@/components/admin/modal";
import AdminPageHeader from "@/components/admin/page-header";
import StatusBadge from "@/components/admin/status-badge";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { queryClient } from "@/lib/query-client";
import { formatDate, formatPrice } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui-store";
import type { AdminOrder, AdminPayment } from "@/types/admin";

const orderStatuses: AdminOrder["status"][] = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

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
      <AdminPageHeader title="Orders & Payments" subtitle="Track order lifecycle, shipping and payment records." />

      <FilterBar>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
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
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
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
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
      </FilterBar>

      <DataTable
        columns={[
          {
            key: "order",
            label: "Order",
            render: (row) => (
              <div>
                <p className="text-white">#{row.id}</p>
                <p className="text-xs text-slate-400">{formatDate(row.created_at)}</p>
              </div>
            ),
          },
          {
            key: "customer",
            label: "Customer",
            render: (row) => <span>User #{row.user}</span>,
          },
          {
            key: "total",
            label: "Total",
            render: (row) => <span>{formatPrice(row.total_amount)}</span>,
          },
          {
            key: "payment",
            label: "Payment",
            render: (row) => <StatusBadge value={row.payment?.status ?? "Pending"} />,
          },
          {
            key: "status",
            label: "Status",
            render: (row) => <StatusBadge value={row.status} />,
          },
          {
            key: "update",
            label: "Update",
            render: (row) => (
              <select
                value={row.status}
                onChange={(event) =>
                  updateStatusMutation.mutate({
                    id: row.id,
                    status: event.target.value as AdminOrder["status"],
                  })
                }
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Link href={`/admin/orders/${row.id}`} className="rounded-lg border border-slate-700 px-2 py-1 text-xs">
                View Detail
              </Link>
            ),
          },
        ]}
        rows={filteredOrders}
        rowKey={(row) => row.id}
        emptyLabel="No orders match current filters."
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Payment Records</h2>
        <DataTable
          columns={[
            {
              key: "order",
              label: "Order",
              render: (row: AdminPayment) => <span>#{row.order_id}</span>,
            },
            {
              key: "amount",
              label: "Amount",
              render: (row: AdminPayment) => <span>{formatPrice(row.amount)}</span>,
            },
            {
              key: "method",
              label: "Method",
              render: (row: AdminPayment) => <span>{row.payment_method}</span>,
            },
            {
              key: "status",
              label: "Status",
              render: (row: AdminPayment) => <StatusBadge value={row.status} />,
            },
            {
              key: "created",
              label: "Created",
              render: (row: AdminPayment) => <span className="text-xs">{formatDate(row.created_at)}</span>,
            },
            {
              key: "actions",
              label: "Actions",
              render: (row: AdminPayment) => (
                <button
                  type="button"
                  onClick={() => setSelectedPaymentOrderId(row.order_id ?? null)}
                  className="rounded-lg border border-slate-700 px-2 py-1 text-xs"
                >
                  View Detail
                </button>
              ),
            },
          ]}
          rows={filteredPayments}
          rowKey={(row) => `${row.order_id}-${row.created_at}`}
          emptyLabel="No payment records found."
        />
      </div>

      <AdminModal open={Boolean(selectedPaymentOrderId)} onClose={() => setSelectedPaymentOrderId(null)} title="Payment Detail">
        {paymentDetailQuery.isLoading ? <AdminLoadingState label="Loading payment detail..." /> : null}
        {paymentDetailQuery.isError ? <AdminErrorState description="Unable to fetch payment detail." /> : null}
        {paymentDetailQuery.data ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-400">Order:</span> #{paymentDetailQuery.data.order_id}
            </p>
            <p>
              <span className="text-slate-400">Amount:</span> {formatPrice(paymentDetailQuery.data.amount)}
            </p>
            <p>
              <span className="text-slate-400">Status:</span> {paymentDetailQuery.data.status}
            </p>
            <p>
              <span className="text-slate-400">Method:</span> {paymentDetailQuery.data.payment_method}
            </p>
            <p>
              <span className="text-slate-400">Transaction:</span> {paymentDetailQuery.data.transaction_id || "N/A"}
            </p>
            <p>
              <span className="text-slate-400">Created:</span> {formatDate(paymentDetailQuery.data.created_at)}
            </p>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}