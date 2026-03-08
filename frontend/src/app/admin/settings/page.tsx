"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import AdminErrorState from "@/components/admin/error-state";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminPageHeader from "@/components/admin/page-header";
import AdminPanel from "@/components/admin/panel";
import { queryKeys } from "@/lib/api/query-keys";
import { authApi } from "@/lib/api/services";

export default function AdminSettingsPage() {
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
  });

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";
  const aiCalibratorUrl = process.env.NEXT_PUBLIC_AI_CALIBRATOR_URL || "";
  const aiStatus = aiCalibratorUrl ? "Configured" : "Not configured";

  if (meQuery.isLoading) {
    return <AdminLoadingState label="Loading settings..." />;
  }

  if (meQuery.isError || !meQuery.data) {
    return <AdminErrorState description="Unable to load settings." />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Settings & Integrations" subtitle="Environment-linked admin configuration and profile controls." />

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel>
          <h2 className="mb-3 text-lg font-semibold text-white">Environment Config</h2>
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              API Base URL: <span className="text-white">{apiBaseUrl}</span>
            </p>
            <p>
              AI Calibrator URL: <span className="text-white">{aiCalibratorUrl || "Not set"}</span>
            </p>
            <p>
              AI Calibrator Status: <span className="text-white">{aiStatus}</span>
            </p>
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="mb-3 text-lg font-semibold text-white">Admin Profile</h2>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Email: {meQuery.data.email}</p>
            <p>Name: {`${meQuery.data.first_name} ${meQuery.data.last_name}`.trim() || "N/A"}</p>
            <p>Role: {meQuery.data.role}</p>
            <Link href="/admin/profile" className="inline-block rounded-lg border border-slate-700 px-3 py-1.5 text-xs">
              Open Profile Controls
            </Link>
          </div>
        </AdminPanel>
      </div>

      <AdminPanel>
        <h2 className="mb-3 text-lg font-semibold text-white">Password Change</h2>
        <p className="text-sm text-slate-400">Password change API is pending integration. UI scaffold is available in profile page.</p>
      </AdminPanel>
    </div>
  );
}