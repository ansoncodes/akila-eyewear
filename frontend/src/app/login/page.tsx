"use client";

import Image from "next/image";
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

const inputClass =
  "w-full border-0 border-b border-[#ddd] bg-transparent px-0 py-2 text-sm text-[#2a241f] outline-none transition-colors duration-200 placeholder:text-[#a6978d] focus:border-[#C4714F]";

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
      className={`${serif.variable} ${sans.variable} h-[100dvh] overflow-hidden bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-login-sans)]`}
    >
      <div className="grid h-full w-full lg:grid-cols-[45%_55%]">
        <aside className="relative hidden h-full lg:block">
          <Image
            src="/images/glassesshop-tyo8ibpCbhs-unsplash.jpg"
            alt="Akila eyewear editorial"
            fill
            sizes="45vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
          <p className="absolute bottom-8 left-8 text-sm italic text-white [font-family:var(--font-login-serif)]">
            Every frame tells a story.
          </p>
        </aside>

        <section className="flex h-full items-center justify-center bg-[#FAF8F5] px-6 py-10 sm:px-10 md:px-16 lg:px-20 xl:px-24">
          <div className="w-full max-w-[460px]">
            <div className="mb-12 flex justify-center lg:justify-start">
              <Link href="/" className="text-[2rem] tracking-[0.08em] text-[#26211d] [font-family:var(--font-login-serif)]">
                AKILA
              </Link>
            </div>

            <form
              className="space-y-7"
              onSubmit={(event) => {
                event.preventDefault();
                loginMutation.mutate();
              }}
            >
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-5xl text-[#241d18] [font-family:var(--font-login-serif)]">Welcome Back.</h1>
                <p className="text-sm text-[#7b6f68]">Sign in to continue your eyewear journey.</p>
              </div>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#9b8f88]">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  required
                  className={inputClass}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#9b8f88]">Password</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder="Enter password"
                  required
                  className={inputClass}
                />
              </label>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full rounded-full bg-[#C4714F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginMutation.isPending ? "Signing in..." : "Login"}
              </button>

              <p className="text-sm text-[#7b6f68]">
                New here?{" "}
                <Link href="/register" className="font-medium text-[#C4714F] hover:opacity-80">
                  Create account
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

