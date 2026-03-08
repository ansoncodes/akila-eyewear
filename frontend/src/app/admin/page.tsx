"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AdminErrorState from "@/components/admin/error-state";
import AdminLoadingState from "@/components/admin/loading-state";
import KpiCard from "@/components/admin/kpi-card";
import AdminPageHeader from "@/components/admin/page-header";
import AdminPanel from "@/components/admin/panel";
import StatusBadge from "@/components/admin/status-badge";
import { adminApi } from "@/lib/api/admin/services";
import {
  buildDashboardKpis,
  orderStatusDistribution,
  salesTrend,
  topSellingProducts,
} from "@/lib/admin/analytics";
import { formatDate, formatPrice } from "@/lib/utils";

const pieColors = ["#22c55e", "#38bdf8", "#f97316", "#f43f5e", "#818cf8", "#eab308"];

export default function AdminDashboardPage() {
  const [trendMode, setTrendMode] = useState<"daily" | "weekly" | "monthly">("daily");

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.dashboard,
  });

  const kpis = useMemo(() => {
    if (!dashboardQuery.data) return null;
    return buildDashboardKpis(dashboardQuery.data);
  }, [dashboardQuery.data]);

  const salesData = useMemo(() => {
    if (!dashboardQuery.data) return [];
    return salesTrend(dashboardQuery.data, trendMode);
  }, [dashboardQuery.data, trendMode]);

  const orderStatusData = useMemo(() => {
    if (!dashboardQuery.data) return [];
    return orderStatusDistribution(dashboardQuery.data);
  }, [dashboardQuery.data]);

  const topProductsData = useMemo(() => {
    if (!dashboardQuery.data) return [];
    return topSellingProducts(dashboardQuery.data);
  }, [dashboardQuery.data]);

  if (dashboardQuery.isLoading) {
    return <AdminLoadingState label="Loading dashboard metrics..." />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data || !kpis) {
    return <AdminErrorState description="Unable to load dashboard data from API." />;
  }

  const latestOrders = [...dashboardQuery.data.orders].slice(0, 5);
  const latestReviews = [...dashboardQuery.data.reviews].slice(0, 5);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Dashboard" subtitle="Operations snapshot for Akila ecommerce." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Total Revenue" value={formatPrice(kpis.totalRevenue)} tone="good" />
        <KpiCard label="Total Orders" value={String(kpis.totalOrders)} />
        <KpiCard label="Total Customers" value={String(kpis.totalCustomers)} />
        <KpiCard label="Total Products" value={String(kpis.totalProducts)} />
        <KpiCard label="Pending Orders" value={String(kpis.pendingOrders)} tone="warn" />
        <KpiCard label="Paid vs Failed" value={`${kpis.paidPayments} / ${kpis.failedPayments}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Sales Trend</h2>
            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTrendMode(mode)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    trendMode === mode ? "bg-cyan-500/20 text-cyan-200" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="mb-4 text-lg font-semibold text-white">Order Status Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusData} dataKey="value" nameKey="name" outerRadius={110}>
                  {orderStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>
      </div>

      <AdminPanel>
        <h2 className="mb-4 text-lg font-semibold text-white">Top-Selling Products</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProductsData}>
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="units" fill="#38bdf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AdminPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel>
          <h2 className="mb-4 text-lg font-semibold text-white">Latest Orders</h2>
          <div className="space-y-3">
            {latestOrders.length === 0 ? (
              <p className="text-sm text-slate-400">No orders found.</p>
            ) : (
              latestOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-slate-800 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-200">Order #{order.id}</p>
                    <StatusBadge value={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{formatDate(order.created_at)}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatPrice(order.total_amount)}</p>
                </div>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="mb-4 text-lg font-semibold text-white">Latest Reviews</h2>
          <div className="space-y-3">
            {latestReviews.length === 0 ? (
              <p className="text-sm text-slate-400">No reviews found.</p>
            ) : (
              latestReviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-slate-800 p-3">
                  <p className="text-sm text-slate-200">{review.user_email}</p>
                  <p className="mt-1 text-sm text-slate-400">Rating: {review.rating}/5</p>
                  <p className="mt-1 text-sm text-slate-300">{review.comment || "No comment"}</p>
                </div>
              ))
            )}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel>
        <h2 className="text-lg font-semibold text-white">Attention Signals</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 p-3">
            <p className="text-sm text-slate-300">Low-stock products</p>
            <p className="mt-1 text-xl font-semibold text-white">N/A</p>
            <p className="mt-1 text-xs text-slate-500">Stock tracking is not available in current backend model.</p>
          </div>
          <div className="rounded-xl border border-slate-800 p-3">
            <p className="text-sm text-slate-300">Returns risk score</p>
            <p className="mt-1 text-xl font-semibold text-white">N/A</p>
            <p className="mt-1 text-xs text-slate-500">Returns analytics endpoint pending integration.</p>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
