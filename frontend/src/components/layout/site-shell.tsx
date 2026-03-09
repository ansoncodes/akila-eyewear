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

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const usesEditorialShell = true;

  return (
    <div className={usesEditorialShell ? "min-h-screen bg-[#FAF8F5] text-[#1e1b18]" : "min-h-screen bg-slate-950 text-slate-100"}>
      {isAuthPage ? null : <AkilaNavbar />}
      <main>{children}</main>
      {usesEditorialShell ? null : <Footer />}
    </div>
  );
}
