"use client";

import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { authApi } from "@/lib/api/services";

export default function ProfilePage() {
  const canRender = useRequireAuth();

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled: canRender,
  });

  if (!canRender) return null;

  if (!meQuery.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState title="Profile unavailable" description="Could not load profile details." />
      </div>
    );
  }

  const user = meQuery.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl text-white">Profile</h1>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">First Name</dt>
            <dd className="mt-1 text-sm text-white">{user.first_name || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Last Name</dt>
            <dd className="mt-1 text-sm text-white">{user.last_name || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-1 text-sm text-white">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Role</dt>
            <dd className="mt-1 text-sm text-white">{user.role}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
