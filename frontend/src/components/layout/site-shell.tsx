"use client";

import { usePathname } from "next/navigation";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useBootstrapAuth } from "@/hooks/use-bootstrap-auth";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  useBootstrapAuth();
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
