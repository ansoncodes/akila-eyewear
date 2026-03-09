"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { adminApi } from "@/lib/api/admin/services";
import {
  buildDashboardKpis,
  orderStatusDistribution,
  salesTrend,
  topSellingProducts,
} from "@/lib/admin/analytics";
import { formatDate, formatPrice } from "@/lib/utils";

const pieColors = ["#C4714F", "#C4A882", "#8FAF8A", "#AAAAAA"];

function statusBadgeClass(value: string) {
  const key = value.toLowerCase();
  if (key === "pending") return "bg-[#f7e7de] text-[#a76040]";
  if (key === "confirmed" || key === "shipped") return "bg-[#f2ece5] text-[#6b594f]";
  if (key === "delivered" || key === "paid" || key === "success") return "bg-[#e9f5ee] text-[#2d7d55]";
  if (key === "cancelled" || key === "failed") return "bg-[#fce9e9] text-[#b34848]";
  return "bg-[#f2ece5] text-[#6b594f]";
}

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

  const topProductsAxisPadding =
    topProductsData.length <= 2 ? 240 : topProductsData.length <= 4 ? 120 : 16;

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
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl text-[#241d18] [font-family:var(--font-heading),serif]">Dashboard</h1>
          <p className="mt-1 text-sm text-[#7b6f68]">Operations snapshot for Akila ecommerce.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Total Revenue", value: formatPrice(kpis.totalRevenue), tone: "good" as const },
          { label: "Total Orders", value: String(kpis.totalOrders), tone: "default" as const },
          { label: "Total Customers", value: String(kpis.totalCustomers), tone: "default" as const },
          { label: "Total Products", value: String(kpis.totalProducts), tone: "default" as const },
          { label: "Pending Orders", value: String(kpis.pendingOrders), tone: "warn" as const },
          { label: "Paid vs Failed", value: `${kpis.paidPayments} / ${kpis.failedPayments}`, tone: "default" as const },
        ].map((card) => (
          <article
            key={card.label}
            className={`rounded-2xl border bg-white p-4 shadow-[0_2px_16px_rgba(63,42,31,0.08)] ${
              card.tone === "good"
                ? "border-[#d4eadf]"
                : card.tone === "warn"
                  ? "border-[#f0dfd1]"
                  : "border-[#ece2d9]"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#9b8f88]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#2f2621]">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#ece2d9] bg-white p-5 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2f2621]">Sales Trend</h2>
            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTrendMode(mode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    trendMode === mode ? "bg-[#f7e7de] text-[#a76040]" : "bg-[#f4ede6] text-[#6b594f]"
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
                <XAxis dataKey="label" stroke="#b9aaa0" tick={{ fill: "#9e8e84", fontSize: 12 }} />
                <YAxis stroke="#b9aaa0" tick={{ fill: "#9e8e84", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#C4714F" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-[#ece2d9] bg-white p-5 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
          <h2 className="mb-4 text-lg font-semibold text-[#2f2621]">Order Status Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusData} dataKey="value" nameKey="name" outerRadius={110} rootTabIndex={-1}>
                  {orderStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#ece2d9] bg-white p-5 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
        <h2 className="mb-4 text-lg font-semibold text-[#2f2621]">Top-Selling Products</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topProductsData}
              margin={{ top: 8, right: 18, left: 6, bottom: 6 }}
              barCategoryGap="35%"
              barGap={0}
            >
              <CartesianGrid stroke="#f1e8df" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#b9aaa0"
                tick={{ fill: "#9e8e84", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#d8c9bd" }}
                padding={{ left: topProductsAxisPadding, right: topProductsAxisPadding }}
              />
              <YAxis
                stroke="#b9aaa0"
                tick={{ fill: "#9e8e84", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#d8c9bd" }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e6d6c9",
                  boxShadow: "0 8px 24px rgba(63,42,31,0.14)",
                  backgroundColor: "#fffaf6",
                  color: "#3d3129",
                }}
                labelStyle={{ color: "#2f2621", fontWeight: 600 }}
                itemStyle={{ color: "#a76040" }}
              />
              <Bar dataKey="units" fill="#C4714F" radius={[10, 10, 0, 0]} maxBarSize={74} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#ece2d9] bg-white p-5 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
          <h2 className="mb-4 text-lg font-semibold text-[#2f2621]">Latest Orders</h2>
          <div className="space-y-3">
            {latestOrders.length === 0 ? (
              <p className="text-sm text-[#8a7c73]">No orders found.</p>
            ) : (
              latestOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-[#efe3d9] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[#4f423a]">Order #{order.id}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#8a7c73]">{formatDate(order.created_at)}</p>
                  <p className="mt-1 text-sm font-semibold text-[#2f2621]">{formatPrice(order.total_amount)}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#ece2d9] bg-white p-5 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
          <h2 className="mb-4 text-lg font-semibold text-[#2f2621]">Latest Reviews</h2>
          <div className="space-y-3">
            {latestReviews.length === 0 ? (
              <p className="text-sm text-[#8a7c73]">No reviews found.</p>
            ) : (
              latestReviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-[#efe3d9] p-3">
                  <p className="text-sm text-[#4f423a]">{review.user_email}</p>
                  <p className="mt-1 text-sm text-[#8a7c73]">Rating: {review.rating}/5</p>
                  <p className="mt-1 text-sm text-[#64534a]">{review.comment || "No comment"}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style jsx global>{`
        .recharts-wrapper:focus,
        .recharts-surface:focus,
        .recharts-sector:focus,
        .recharts-rectangle:focus {
          outline: none !important;
        }
      `}</style>
    </div>
  );
}

