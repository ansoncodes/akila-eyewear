"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import AdminErrorState from "@/components/admin/error-state";
import AdminLoadingState from "@/components/admin/loading-state";
import { queryKeys } from "@/lib/api/query-keys";
import { authApi } from "@/lib/api/services";

const fieldClass =
  "w-full rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129] placeholder:text-[#a18f84] focus:border-[#d9b8a5] focus:outline-none focus:ring-2 focus:ring-[#edd6c8]";

export default function AdminProfilePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        current_password: currentPassword,
        new_password: nextPassword,
        retype_password: retypePassword,
      }),
    onSuccess: () => {
      toast.success("Password updated");
      setCurrentPassword("");
      setNextPassword("");
      setRetypePassword("");
    },
    onError: (error: unknown) => {
      const data = (error as { response?: { data?: Record<string, string[] | string> } })?.response?.data;
      if (data && typeof data === "object") {
        const [field, messages] = Object.entries(data)[0] ?? [];
        const firstMessage = Array.isArray(messages) ? messages[0] : messages;
        if (field && firstMessage) {
          toast.error(`${field}: ${firstMessage}`);
          return;
        }
      }
      toast.error("Could not update password");
    },
  });

  if (meQuery.isLoading) {
    return <AdminLoadingState label="Loading profile..." />;
  }

  if (meQuery.isError || !meQuery.data) {
    return <AdminErrorState description="Unable to load admin profile." />;
  }

  const user = meQuery.data;
  const passwordsMatch = nextPassword === retypePassword;
  const canSubmit = Boolean(currentPassword && nextPassword && retypePassword && passwordsMatch);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-[#241d18] [font-family:var(--font-heading),serif]">Admin Profile</h1>
        <p className="mt-1 text-sm text-[#7b6f68]">Profile overview and password security controls.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#ece2d9] bg-white p-5 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
          <h2 className="mb-3 text-lg font-semibold text-[#2f2621]">Account</h2>
          <div className="space-y-2 text-sm text-[#4f423a]">
            <p>
              <span className="text-[#8a7c73]">Email:</span> {user.email}
            </p>
            <p>
              <span className="text-[#8a7c73]">Name:</span> {`${user.first_name} ${user.last_name}`.trim() || "N/A"}
            </p>
            <p>
              <span className="text-[#8a7c73]">Role:</span> {user.role}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#ece2d9] bg-white p-5 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
          <h2 className="mb-3 text-lg font-semibold text-[#2f2621]">Password Change</h2>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!passwordsMatch) {
                toast.error("New password and retype password must match");
                return;
              }
              passwordMutation.mutate();
            }}
          >
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              className={fieldClass}
            />
            <input
              type="password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              placeholder="New password"
              className={fieldClass}
            />
            <input
              type="password"
              value={retypePassword}
              onChange={(event) => setRetypePassword(event.target.value)}
              placeholder="Retype new password"
              className={fieldClass}
            />
            {!passwordsMatch && retypePassword ? (
              <p className="text-xs text-[#bf5a5a]">Passwords do not match.</p>
            ) : null}
            <button
              type="submit"
              disabled={!canSubmit || passwordMutation.isPending}
              className="rounded-xl bg-[#C4714F] px-4 py-2 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#b96543] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordMutation.isPending ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

