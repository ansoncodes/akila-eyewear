"use client";

import Image from "next/image";
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

const inputClass =
  "w-full border-0 border-b border-[#ddd] bg-transparent px-0 py-2 text-sm text-[#2a241f] outline-none transition-colors duration-200 placeholder:text-[#a6978d] focus:border-[#C4714F]";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [retypePassword, setRetypePassword] = useState("");

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

  const passwordsMatch = form.password === retypePassword;
  const canSubmit =
    Boolean(form.first_name && form.last_name && form.email && form.password && retypePassword && passwordsMatch) &&
    !registerMutation.isPending;

  return (
    <div
      className={`${serif.variable} ${sans.variable} h-[100dvh] overflow-hidden bg-[#FAF8F5] text-[#2a241f] [font-family:var(--font-register-sans)]`}
    >
      <div className="grid h-full w-full lg:grid-cols-[45%_55%]">
        <aside className="relative hidden h-full lg:block">
          <Image
            src="/images/zeelool-glasses-9nbzZ8ZimU0-unsplash.jpg"
            alt="Akila register editorial"
            fill
            sizes="45vw"
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
          <p className="absolute bottom-8 left-8 text-sm italic text-white [font-family:var(--font-register-serif)]">
            Join a community that sees differently.
          </p>
        </aside>

        <section className="flex h-full items-center justify-center bg-[#FAF8F5] px-6 py-10 sm:px-10 md:px-16 lg:px-20 xl:px-24">
          <div className="w-full max-w-[500px]">
            <div className="mb-12 flex justify-center lg:justify-start">
              <Link href="/" className="text-[2rem] tracking-[0.08em] text-[#26211d] [font-family:var(--font-register-serif)]">
                AKILA
              </Link>
            </div>

            <form
              className="space-y-7"
              onSubmit={(event) => {
                event.preventDefault();
                if (!passwordsMatch) {
                  toast.error("Password and retype password must match");
                  return;
                }
                registerMutation.mutate();
              }}
            >
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-5xl text-[#241d18] [font-family:var(--font-register-serif)]">Create Your Account.</h1>
                <p className="text-sm text-[#7b6f68]">Start your premium eyewear experience.</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#9b8f88]">First Name</span>
                  <input
                    value={form.first_name}
                    onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
                    placeholder="First name"
                    required
                    className={inputClass}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[#9b8f88]">Last Name</span>
                  <input
                    value={form.last_name}
                    onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
                    placeholder="Last name"
                    required
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#9b8f88]">Email</span>
                <input
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  type="email"
                  placeholder="you@example.com"
                  required
                  className={inputClass}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#9b8f88]">Password</span>
                <input
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  type="password"
                  placeholder="At least 8 characters"
                  required
                  className={inputClass}
                />
                <p className="text-xs text-[#9b8f88]">At least 8 characters</p>
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#9b8f88]">Retype Password</span>
                <input
                  value={retypePassword}
                  onChange={(event) => setRetypePassword(event.target.value)}
                  type="password"
                  placeholder="Retype your password"
                  required
                  className={inputClass}
                />
              </label>

              {!passwordsMatch && retypePassword ? (
                <p className="text-xs text-[#bf5a5a]">Passwords do not match.</p>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-full bg-[#C4714F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b66342] disabled:cursor-not-allowed disabled:opacity-70"
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
          </div>
        </section>
      </div>
    </div>
  );
}

