"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter, Playfair_Display } from "next/font/google";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { authApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth-store";
import type { UserProfilePayload } from "@/types/api";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-profile-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-profile-sans",
});

const emptyForm: UserProfilePayload = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "",
};

export default function ProfilePage() {
  const canRender = useRequireAuth();
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [form, setForm] = useState<UserProfilePayload>(emptyForm);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled: canRender,
  });

  useEffect(() => {
    if (!meQuery.data) return;

    setForm({
      email: meQuery.data.email ?? "",
      first_name: meQuery.data.first_name ?? "",
      last_name: meQuery.data.last_name ?? "",
      phone: meQuery.data.phone ?? "",
      address_line1: meQuery.data.address_line1 ?? "",
      address_line2: meQuery.data.address_line2 ?? "",
      city: meQuery.data.city ?? "",
      state: meQuery.data.state ?? "",
      pincode: meQuery.data.pincode ?? "",
      country: meQuery.data.country ?? "",
    });
  }, [meQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: UserProfilePayload) => authApi.updateProfile(payload),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      toast.success("Profile updated");
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
      toast.error("Could not update profile");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: authApi.deleteProfile,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success("Account deleted");
      router.replace("/register");
    },
    onError: () => toast.error("Could not delete account"),
  });

  if (!canRender) {
    return null;
  }

  if (meQuery.isLoading) {
    return (
      <div
        className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-profile-sans)]`}
      >
      <div className="mx-auto w-full max-w-[1380px] space-y-6 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
          <div className="h-10 w-56 animate-pulse rounded-full bg-[#eee1d6]" />
          <div className="h-[420px] animate-pulse rounded-3xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]" />
        </div>
      </div>
    );
  }

  if (!meQuery.data) {
    return (
      <div
        className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-profile-sans)]`}
      >
      <div className="mx-auto w-full max-w-[1380px] px-4 pb-16 pt-28 text-[#7b6f68] sm:px-8 lg:px-12">
          Profile unavailable right now.
        </div>
      </div>
    );
  }

  const isBusy = updateMutation.isPending || deleteMutation.isPending;

  function setField(field: keyof UserProfilePayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMutation.mutate(form);
  }

  function onDelete() {
    const confirmed = window.confirm("Delete your account permanently?");
    if (!confirmed) return;
    deleteMutation.mutate();
  }

  return (
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-profile-sans)]`}
    >
      <div className="mx-auto w-full max-w-[1380px] space-y-8 px-4 pb-16 pt-28 sm:px-8 lg:px-12">
        <section className="space-y-3">
          <h1 className="text-5xl text-[#241d18] [font-family:var(--font-profile-serif)] sm:text-6xl">My Profile</h1>
          <p className="text-[#7b6f68]">Manage your personal details and saved address information.</p>
          <div className="h-[2px] w-24 bg-[#C4714F]" />
        </section>

        <form onSubmit={onSave} className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <section className="space-y-6 rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-8">
            <div>
              <h2 className="text-2xl text-[#2d251f] [font-family:var(--font-profile-serif)]">Personal Details</h2>
              <p className="mt-1 text-sm text-[#8b7d74]">Keep your account information up to date.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">First Name</span>
                <input
                  value={form.first_name ?? ""}
                  onChange={(e) => setField("first_name", e.target.value)}
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#C4714F]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Last Name</span>
                <input
                  value={form.last_name ?? ""}
                  onChange={(e) => setField("last_name", e.target.value)}
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#C4714F]"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Email</span>
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setField("email", e.target.value)}
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#C4714F]"
                  required
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Phone</span>
                <input
                  value={form.phone ?? ""}
                  onChange={(e) => setField("phone", e.target.value)}
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#C4714F]"
                />
              </label>
            </div>

            <div>
              <h3 className="text-xl text-[#2d251f] [font-family:var(--font-profile-serif)]">Address</h3>
              <p className="mt-1 text-sm text-[#8b7d74]">This helps you checkout faster.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Address Line 1</span>
                <input
                  value={form.address_line1 ?? ""}
                  onChange={(e) => setField("address_line1", e.target.value)}
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#C4714F]"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Address Line 2</span>
                <input
                  value={form.address_line2 ?? ""}
                  onChange={(e) => setField("address_line2", e.target.value)}
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#C4714F]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">City</span>
                <input
                  value={form.city ?? ""}
                  onChange={(e) => setField("city", e.target.value)}
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#C4714F]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">State</span>
                <input
                  value={form.state ?? ""}
                  onChange={(e) => setField("state", e.target.value)}
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#C4714F]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Pincode</span>
                <input
                  value={form.pincode ?? ""}
                  onChange={(e) => setField("pincode", e.target.value)}
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#C4714F]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Country</span>
                <input
                  value={form.country ?? ""}
                  onChange={(e) => setField("country", e.target.value)}
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#C4714F]"
                />
              </label>
            </div>
          </section>

          <aside className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="space-y-1">
              <h3 className="text-xl text-[#2d251f] [font-family:var(--font-profile-serif)]">Account Actions</h3>
              <p className="text-sm text-[#8b7d74]">Role: {meQuery.data.role}</p>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full rounded-full bg-[#C4714F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              disabled={isBusy}
              className="w-full rounded-full border border-[#d8c8bb] px-4 py-2.5 text-sm font-semibold text-[#5a4c43] transition hover:border-[#C4714F] hover:text-[#C4714F] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Clear Fields
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={isBusy}
              className="w-full rounded-full border border-[#e3c9ba] px-4 py-2.5 text-sm font-semibold text-[#a26143] transition hover:border-[#b55d3a] hover:text-[#b55d3a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Delete Account
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}

