"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

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
    <div className="relative min-h-screen overflow-hidden bg-[#f5eee7] px-4 py-10 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-28 top-[-8rem] h-72 w-72 rounded-full bg-[#f3d8c7]/70 blur-3xl" />
        <div className="absolute -right-20 bottom-[-8rem] h-72 w-72 rounded-full bg-[#edd9cb]/75 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <section className="relative hidden min-h-[560px] overflow-hidden rounded-[2.2rem] border border-[#eadccf] shadow-[0_30px_70px_rgba(95,67,50,0.16)] lg:block">
          <Image
            src="/images/confident-caucasian-girl-dark-sunglasses-looking-distance-outdoor-shot-good-humoured-fashionable-woman.jpg"
            alt="Akila editorial visual"
            fill
            className="object-cover object-[60%_center]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/45" />
          <div className="absolute inset-x-0 bottom-0 p-9 text-[#fff4ec]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#f6dccb]">Akila Admin</p>
            <h1 className="mt-3 text-4xl leading-tight [font-family:var(--font-home-serif)]">
              Crafted operations for premium eyewear.
            </h1>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#eadccf] bg-[#faf8f5]/95 p-6 shadow-[0_18px_46px_rgba(63,42,31,0.12)] backdrop-blur sm:p-8">
          <p className="text-xs uppercase tracking-[0.26em] text-[#b89f91]">Akila</p>
          <h2 className="mt-3 text-4xl text-[#241d18] [font-family:var(--font-home-serif)]">Admin Login</h2>
          <p className="mt-2 text-sm text-[#7b6f68]">Access Akila operations dashboard</p>

          <form
            className="mt-7 space-y-3"
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
              className="w-full rounded-xl border border-[#e6d6c9] bg-white px-3 py-2.5 text-sm text-[#3d3129] outline-none ring-[#edd6c8] focus:ring-2"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-[#e6d6c9] bg-white px-3 py-2.5 text-sm text-[#3d3129] outline-none ring-[#edd6c8] focus:ring-2"
            />
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-1 w-full rounded-xl bg-[#C4714F] px-4 py-2.5 text-sm font-semibold text-[#fff8f2] shadow-[0_10px_24px_rgba(196,113,79,0.3)] transition hover:bg-[#b96543] disabled:opacity-60"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-xs text-[#9b8f88]">Admin-only access. Unauthorized accounts are blocked.</p>
        </section>
      </div>
    </div>
  );
}
