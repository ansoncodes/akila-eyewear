"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import AdminBreadcrumbs from "@/components/admin/breadcrumbs";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAdminUiStore } from "@/store/admin-ui-store";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/catalog", label: "Catalog" },
  { href: "/admin/calibration", label: "Calibration" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const globalSearch = useAdminUiStore((state) => state.globalSearch);
  const setGlobalSearch = useAdminUiStore((state) => state.setGlobalSearch);

  function logout() {
    clearAuth();
    router.push("/admin/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <AdminBreadcrumbs />
            <p className="text-sm text-slate-400">Manage catalog, orders, calibration, and customer operations.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Global search"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2 sm:w-60"
            />
            <button
              onClick={() => router.push("/admin/products")}
              className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
              type="button"
            >
              Search Products
            </button>
            <div className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200">
              {user?.first_name || user?.email || "Admin"}
            </div>
            <button
              onClick={logout}
              className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-950"
              type="button"
            >
              Logout
            </button>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {navItems.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs",
                  active ? "border-cyan-600 bg-cyan-500/20 text-cyan-100" : "border-slate-700 text-slate-300"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}