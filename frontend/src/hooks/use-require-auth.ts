"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth-store";

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [token, router, pathname]);

  return Boolean(token);
}
