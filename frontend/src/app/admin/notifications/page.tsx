"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import DataTable from "@/components/admin/data-table";
import AdminErrorState from "@/components/admin/error-state";
import FilterBar from "@/components/admin/filter-bar";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminPageHeader from "@/components/admin/page-header";
import StatusBadge from "@/components/admin/status-badge";
import { isMissingApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { queryClient } from "@/lib/query-client";
import { formatDate } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui-store";

export default function AdminNotificationsPage() {
  const globalSearch = useAdminUiStore((state) => state.globalSearch);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [broadcast, setBroadcast] = useState(true);
  const [apiConnected, setApiConnected] = useState(true);

  const notificationsQuery = useQuery({
    queryKey: queryKeys.adminNotifications,
    queryFn: async () => {
      try {
        const data = await adminApi.notifications();
        setApiConnected(true);
        return data;
      } catch (error) {
        if (isMissingApiError(error)) {
          setApiConnected(false);
          return [];
        }
        throw error;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createNotification({
        title,
        message,
        user: broadcast ? undefined : Number(userId),
        broadcast_customers: broadcast,
      }),
    onSuccess: () => {
      toast.success("Notification action completed");
      setTitle("");
      setMessage("");
      setUserId("");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminNotifications });
    },
    onError: (error) => {
      if (isMissingApiError(error)) {
        setApiConnected(false);
        toast.error("Notifications API not connected");
        return;
      }
      toast.error("Unable to send notification");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => adminApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminNotifications });
    },
  });

  const markReadAllMutation = useMutation({
    mutationFn: () => adminApi.markNotificationReadAll(),
    onSuccess: () => {
      toast.success("All notifications marked read");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminNotifications });
    },
    onError: () => toast.error("Unable to update notifications"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteNotification(id),
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminNotifications });
    },
    onError: () => toast.error("Unable to delete notification"),
  });

  const filtered = useMemo(() => {
    return (notificationsQuery.data ?? []).filter((item) => {
      if (!globalSearch) return true;
      return `${item.title} ${item.message} ${item.user_email ?? ""}`
        .toLowerCase()
        .includes(globalSearch.toLowerCase());
    });
  }, [notificationsQuery.data, globalSearch]);

  if (notificationsQuery.isLoading) {
    return <AdminLoadingState label="Loading notifications..." />;
  }

  if (notificationsQuery.isError) {
    return <AdminErrorState description="Unable to load notifications." />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications"
        subtitle="Send customer updates and monitor delivery/read status."
        action={
          <button
            type="button"
            onClick={() => markReadAllMutation.mutate()}
            className="rounded-xl border border-[#ddc9bb] bg-white px-4 py-2 text-sm text-[#6b594f] hover:bg-[#f8eee7]"
          >
            Mark All Read
          </button>
        }
      />

      {!apiConnected ? (
        <AdminErrorState
          title="API not connected"
          description="Notification management endpoint is unavailable. UI is ready and waiting for backend integration."
        />
      ) : null}

      <form
        className="grid gap-3 rounded-2xl border border-[#ece2d9] bg-white p-4 shadow-[0_2px_16px_rgba(63,42,31,0.08)] sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate();
        }}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Notification title"
          required
          className="rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129]"
        />
        <input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="User ID (if not broadcast)"
          disabled={broadcast}
          className="rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129] disabled:bg-[#f7efe8] disabled:opacity-60"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message"
          required
          className="rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129] sm:col-span-2"
          rows={3}
        />
        <label className="flex items-center gap-2 rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#4f423a]">
          <input type="checkbox" checked={broadcast} onChange={(event) => setBroadcast(event.target.checked)} />
          Broadcast to customers
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[#C4714F] px-4 py-2 text-sm font-semibold text-[#fff8f2] shadow-[0_10px_24px_rgba(196,113,79,0.3)] hover:bg-[#b96543]"
        >
          Send Notification
        </button>
      </form>

      <FilterBar>
        <p className="text-sm text-[#8a7c73]">Showing {filtered.length} notifications</p>
      </FilterBar>

      <DataTable
        columns={[
          {
            key: "title",
            label: "Title",
            render: (row) => (
              <div>
                <p className="font-medium text-[#2f2621]">{row.title}</p>
                <p className="text-xs text-[#8a7c73]">{row.user_email || `User #${row.user}`}</p>
              </div>
            ),
          },
          {
            key: "message",
            label: "Message",
            render: (row) => <p className="max-w-[360px] text-xs">{row.message}</p>,
          },
          {
            key: "status",
            label: "Read",
            render: (row) => <StatusBadge value={row.is_read ? "Read" : "Unread"} />,
          },
          {
            key: "date",
            label: "Created",
            render: (row) => <span className="text-xs">{formatDate(row.created_at)}</span>,
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => markReadMutation.mutate(row.id)}
                  className="rounded-lg border border-[#ddc9bb] bg-white px-2 py-1 text-xs text-[#6b594f] hover:bg-[#f8eee7]"
                >
                  Mark Read
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(row.id)}
                  className="rounded-lg border border-[#f0cfcd] bg-[#fdf2f2] px-2 py-1 text-xs text-[#b34848] hover:bg-[#fae5e5]"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={filtered}
        rowKey={(row) => row.id}
        emptyLabel="No notifications available."
      />
    </div>
  );
}

