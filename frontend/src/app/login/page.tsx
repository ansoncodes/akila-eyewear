"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { authApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/shop";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const tokens = await authApi.login({ email, password });
      setTokens({ accessToken: tokens.access, refreshToken: tokens.refresh });
      const user = await authApi.me();
      setUser(user);
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Welcome back");
      router.push(nextPath);
    },
    onError: () => toast.error("Invalid credentials"),
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <form
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          loginMutation.mutate();
        }}
      >
        <h1 className="text-4xl text-white">Login</h1>

        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />

        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="Password"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />

        <button type="submit" className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950">
          Login
        </button>

        <p className="text-sm text-slate-300">
          New user? <Link href="/register" className="text-cyan-300">Create account</Link>
        </p>
      </form>
    </div>
  );
}
