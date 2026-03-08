"use client";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useBootstrapAuth } from "@/hooks/use-bootstrap-auth";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  useBootstrapAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
