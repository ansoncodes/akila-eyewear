"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import AdminPageHeader from "@/components/admin/page-header";
import { authApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const tokenData = await authApi.login({ email, password });
      setTokens({
        accessToken: tokenData.access,
        refreshToken: tokenData.refresh,
      });

      const user = await authApi.me();
      if (user.role !== "admin") {
        throw new Error("Admin access required");
      }

      setUser(user);
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Admin login successful");
      router.push(nextPath);
    },
    onError: () => {
      clearAuth();
      toast.error("Invalid admin credentials");
    },
  });

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
        <AdminPageHeader
          title="Admin Login"
          subtitle="Access Akila operations dashboard"
        />

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate();
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Admin email"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-400 focus:ring-2"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-400 focus:ring-2"
          />
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}