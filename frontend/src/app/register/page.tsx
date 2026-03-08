"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  variable: "--font-register-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-register-sans",
});

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const registerMutation = useMutation({
    mutationFn: async () => {
      await authApi.register(form);
      const tokens = await authApi.login({ email: form.email, password: form.password });
      setTokens({ accessToken: tokens.access, refreshToken: tokens.refresh });
      const user = await authApi.me();
      setUser(user);
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Account created");
      router.push("/shop");
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
      toast.error("Could not register");
    },
  });

  return (
    <div
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-register-sans)]`}
    >
      <div className="mx-auto grid w-full max-w-[1380px] gap-8 px-4 pb-16 pt-28 sm:px-8 lg:grid-cols-[1fr_460px] lg:px-12">
        <section className="hidden rounded-3xl bg-[#f7eee4] p-10 shadow-[0_2px_16px_rgba(0,0,0,0.05)] lg:block">
          <p className="text-xs uppercase tracking-[0.16em] text-[#a19085]">Akila Membership</p>
          <h1 className="mt-3 text-6xl leading-[1.05] text-[#241d18] [font-family:var(--font-register-serif)]">
            Create Your
            <br />
            Account.
          </h1>
          <p className="mt-4 max-w-[36ch] text-[#6f6158]">
            Join Akila to save your wishlist, place orders faster, and personalize your frame journey.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-8">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              registerMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <h2 className="text-4xl text-[#241d18] [font-family:var(--font-register-serif)]">Create Account</h2>
              <p className="text-sm text-[#7b6f68]">Start your premium eyewear experience.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">First Name</span>
                <input
                  value={form.first_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
                  placeholder="First name"
                  required
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm text-[#2a241f] outline-none transition focus:border-[#C4714F]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Last Name</span>
                <input
                  value={form.last_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
                  placeholder="Last name"
                  required
                  className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm text-[#2a241f] outline-none transition focus:border-[#C4714F]"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Email</span>
              <input
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm text-[#2a241f] outline-none transition focus:border-[#C4714F]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Password</span>
              <input
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                type="password"
                placeholder="At least 8 characters"
                required
                className="w-full rounded-xl border border-[#e7d8cc] bg-[#fffdfb] px-3 py-2.5 text-sm text-[#2a241f] outline-none transition focus:border-[#C4714F]"
              />
            </label>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full rounded-full bg-[#C4714F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {registerMutation.isPending ? "Creating..." : "Create Account"}
            </button>

            <p className="text-sm text-[#7b6f68]">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[#C4714F] hover:opacity-80">
                Login
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}

