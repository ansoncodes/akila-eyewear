"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/catalog", label: "Catalog Meta" },
  { href: "/admin/orders", label: "Orders & Payments" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/profile", label: "Profile" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 bg-[#FAF8F5] p-6 lg:block">
      <Link href="/admin" className="inline-block text-[1.45rem] tracking-[0.08em] text-[#26211d] [font-family:var(--font-heading),serif]">
        AKILA ADMIN
      </Link>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block border-l-[3px] px-4 py-2.5 text-sm font-medium transition",
                active
                  ? "border-l-[#C4714F] text-[#a76040]"
                  : "border-l-transparent text-[#555] hover:text-[#2f2621]"
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
