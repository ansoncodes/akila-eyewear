"use client";

import { usePathname } from "next/navigation";

import AdminShell from "@/components/admin/admin-shell";
import AdminLoadingState from "@/components/admin/loading-state";
import { useRequireAdmin } from "@/hooks/use-require-admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const isProtectedRoute = !isLoginPage;

  const { isAllowed, isLoading } = useRequireAdmin(isProtectedRoute);

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  if (isLoading || !isAllowed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <AdminLoadingState label="Verifying admin access..." />
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}