"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { EmptyState } from "@/components/ui/empty-state";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { notificationApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const canRender = useRequireAuth();

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: notificationApi.list,
    enabled: canRender,
  });

  const readMutation = useMutation({
    mutationFn: (id: number) => notificationApi.read(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
    onError: () => toast.error("Could not update notification"),
  });

  const readAllMutation = useMutation({
    mutationFn: notificationApi.readAll,
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: () => toast.error("Could not update notifications"),
  });

  if (!canRender) return null;

  const notifications = notificationsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl text-white">Notifications</h1>
        <button onClick={() => readAllMutation.mutate()} className="rounded-lg border border-slate-700 px-4 py-2 text-sm">
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="Order and payment updates will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl border p-4 ${item.is_read ? "border-slate-800 bg-slate-900/70" : "border-cyan-700 bg-cyan-950/30"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <span className="text-xs text-slate-300">{formatDate(item.created_at)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-200">{item.message}</p>
              {!item.is_read ? (
                <button onClick={() => readMutation.mutate(item.id)} className="mt-3 text-sm text-cyan-300">
                  Mark as read
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
