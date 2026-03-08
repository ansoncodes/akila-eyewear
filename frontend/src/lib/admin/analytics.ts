import type { AdminDashboardData } from "@/types/admin";

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

export function buildDashboardKpis(data: AdminDashboardData) {
  const totalRevenue = data.payments
    .filter((payment) => payment.status === "Paid")
    .reduce((acc, payment) => acc + toNumber(payment.amount), 0);

  const paidPayments = data.payments.filter((payment) => payment.status === "Paid").length;
  const failedPayments = data.payments.filter((payment) => payment.status === "Failed").length;
  const pendingOrders = data.orders.filter((order) => order.status === "Pending").length;

  return {
    totalRevenue,
    totalOrders: data.orders.length,
    totalCustomers: data.customers.length,
    totalProducts: data.products.length,
    pendingOrders,
    paidPayments,
    failedPayments,
  };
}

export function salesTrend(
  data: AdminDashboardData,
  mode: "daily" | "weekly" | "monthly"
): Array<{ label: string; revenue: number }> {
  const now = new Date();
  const points = new Map<string, number>();

  data.payments
    .filter((payment) => payment.status === "Paid")
    .forEach((payment) => {
      const created = new Date(payment.created_at);
      let key = "";

      if (mode === "daily") {
        key = dateKey(created);
      }

      if (mode === "weekly") {
        const copy = new Date(created);
        const day = copy.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        copy.setUTCDate(copy.getUTCDate() + diff);
        key = dateKey(copy);
      }

      if (mode === "monthly") {
        key = `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, "0")}`;
      }

      if (key) {
        points.set(key, (points.get(key) ?? 0) + toNumber(payment.amount));
      }
    });

  if (mode === "daily") {
    for (let i = 13; i >= 0; i -= 1) {
      const pointDate = new Date(now);
      pointDate.setUTCDate(now.getUTCDate() - i);
      const key = dateKey(pointDate);
      if (!points.has(key)) points.set(key, 0);
    }
  }

  if (mode === "weekly") {
    for (let i = 7; i >= 0; i -= 1) {
      const pointDate = new Date(now);
      pointDate.setUTCDate(now.getUTCDate() - i * 7);
      const day = pointDate.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      pointDate.setUTCDate(pointDate.getUTCDate() + diff);
      const key = dateKey(pointDate);
      if (!points.has(key)) points.set(key, 0);
    }
  }

  if (mode === "monthly") {
    for (let i = 5; i >= 0; i -= 1) {
      const pointDate = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1);
      const key = `${pointDate.getUTCFullYear()}-${String(pointDate.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!points.has(key)) points.set(key, 0);
    }
  }

  return [...points.entries()]
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([label, revenue]) => ({ label, revenue: Number(revenue.toFixed(2)) }));
}

export function orderStatusDistribution(data: AdminDashboardData) {
  const map = new Map<string, number>();
  data.orders.forEach((order) => {
    map.set(order.status, (map.get(order.status) ?? 0) + 1);
  });
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

export function topSellingProducts(data: AdminDashboardData) {
  const map = new Map<number, { productId: number; name: string; units: number; revenue: number }>();

  data.orders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = map.get(item.product);
      const lineRevenue = toNumber(item.price_at_purchase) * item.quantity;
      if (existing) {
        existing.units += item.quantity;
        existing.revenue += lineRevenue;
      } else {
        map.set(item.product, {
          productId: item.product,
          name: item.product_name,
          units: item.quantity,
          revenue: lineRevenue,
        });
      }
    });
  });

  return [...map.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)
    .map((item) => ({ ...item, revenue: Number(item.revenue.toFixed(2)) }));
}