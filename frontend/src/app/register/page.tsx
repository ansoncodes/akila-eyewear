"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { authApi } from "@/lib/api/services";
import { useAuthStore } from "@/store/auth-store";

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
      toast.success("Account created");
      router.push("/shop");
    },
    onError: () => toast.error("Could not register"),
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <form
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          registerMutation.mutate();
        }}
      >
        <h1 className="text-4xl text-white">Create Account</h1>

        <input
          value={form.first_name}
          onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
          placeholder="First name"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />

        <input
          value={form.last_name}
          onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
          placeholder="Last name"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />

        <input
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />

        <input
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          type="password"
          placeholder="Password"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />

        <button type="submit" className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950">
          Register
        </button>

        <p className="text-sm text-slate-300">
          Already have an account? <Link href="/login" className="text-cyan-300">Login</Link>
        </p>
      </form>
    </div>
  );
}
