"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/catalog", label: "Catalog Meta" },
  { href: "/admin/calibration", label: "3D Calibration" },
  { href: "/admin/orders", label: "Orders & Payments" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/profile", label: "Profile" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-800 bg-slate-950 p-6 lg:block">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Akila</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Admin Panel</h1>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}