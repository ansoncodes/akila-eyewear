"use client";

import { usePathname } from "next/navigation";

import AkilaNavbar from "@/components/layout/akila-navbar";
import Footer from "@/components/layout/footer";
import { useBootstrapAuth } from "@/hooks/use-bootstrap-auth";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  useBootstrapAuth();
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  const usesEditorialShell =
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/products" ||
    pathname.startsWith("/product/") ||
    pathname === "/wishlist" ||
    pathname === "/cart" ||
    pathname === "/account" ||
    pathname === "/profile" ||
    pathname.startsWith("/try-on/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/checkout" ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/") ||
    pathname === "/order" ||
    pathname.startsWith("/order/");

  return (
    <div className={usesEditorialShell ? "min-h-screen bg-[#FAF8F5] text-[#1e1b18]" : "min-h-screen bg-slate-950 text-slate-100"}>
      <AkilaNavbar />
      <main>{children}</main>
      {usesEditorialShell ? null : <Footer />}
    </div>
  );
}
