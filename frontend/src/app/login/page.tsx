"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Inter, Playfair_Display } from "next/font/google";
import toast from "react-hot-toast";

import { authApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth-store";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-login-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-login-sans",
});

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
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Invalid credentials";
      toast.error(message);
    },
  });

  return (
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-login-sans)]`}
    >
      <div className="mx-auto grid w-full max-w-[1380px] gap-8 px-4 pb-16 pt-28 sm:px-8 lg:grid-cols-[1fr_440px] lg:px-12">
        <section className="hidden rounded-3xl bg-[#f7eee4] p-10 shadow-[0_2px_16px_rgba(0,0,0,0.05)] lg:block">
          <p className="text-xs uppercase tracking-[0.16em] text-[#a19085]">Akila Account</p>
          <h1 className="mt-3 text-6xl leading-[1.05] text-[#241d18] [font-family:var(--font-login-serif)]">
            Welcome
            <br />
            Back.
          </h1>
          <p className="mt-4 max-w-[34ch] text-[#6f6158]">
            Sign in to continue your eyewear journey, manage orders, and save your favorite frames.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-8">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <h2 className="text-4xl text-[#241d18] [font-family:var(--font-login-serif)]">Login</h2>
              <p className="text-sm text-[#7b6f68]">Access your account and continue shopping.</p>
            </div>

            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm text-[#2a241f] outline-none transition focus:border-[#C4714F]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Enter password"
                required
                className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm text-[#2a241f] outline-none transition focus:border-[#C4714F]"
              />
            </label>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-full bg-[#C4714F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loginMutation.isPending ? "Signing in..." : "Login"}
            </button>

            <p className="text-sm text-[#7b6f68]">
              New user?{" "}
              <Link href="/register" className="font-medium text-[#C4714F] hover:opacity-80">
                Create account
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

