"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import AdminErrorState from "@/components/admin/error-state";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminPageHeader from "@/components/admin/page-header";
import AdminPanel from "@/components/admin/panel";
import { queryKeys } from "@/lib/api/query-keys";
import { authApi } from "@/lib/api/services";

export default function AdminProfilePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
  });

  if (meQuery.isLoading) {
    return <AdminLoadingState label="Loading profile..." />;
  }

  if (meQuery.isError || !meQuery.data) {
    return <AdminErrorState description="Unable to load admin profile." />;
  }

  const user = meQuery.data;

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Admin Profile" subtitle="Profile overview and password security controls." />

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel>
          <h2 className="mb-3 text-lg font-semibold text-white">Account</h2>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Email: {user.email}</p>
            <p>Name: {`${user.first_name} ${user.last_name}`.trim() || "N/A"}</p>
            <p>Role: {user.role}</p>
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="mb-3 text-lg font-semibold text-white">Password Change</h2>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              placeholder="New password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled
              className="cursor-not-allowed rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-500"
            >
              Pending API Integration
            </button>
          </form>
        </AdminPanel>
      </div>
    </div>
  );
}