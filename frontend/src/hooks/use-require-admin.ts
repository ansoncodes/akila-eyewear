"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import { authApi } from "@/lib/api/services";
import { useAuthStore } from "@/store/auth-store";

export function useRequireAdmin(enabled = true) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled: enabled && Boolean(token) && !user,
    retry: false,
  });

  useEffect(() => {
    if (!enabled) return;
    if (meQuery.data) {
      setUser(meQuery.data);
    }
  }, [enabled, meQuery.data, setUser]);

  useEffect(() => {
    if (!enabled) return;

    if (!token) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }

    if (meQuery.isError) {
      router.replace("/admin/login");
      return;
    }

    const currentUser = user || meQuery.data;
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/");
    }
  }, [enabled, token, user, meQuery.data, meQuery.isError, router, pathname]);

  if (!enabled) {
    return { isAllowed: true, isLoading: false };
  }

  if (!token) {
    return { isAllowed: false, isLoading: false };
  }

  if (!user && meQuery.isLoading) {
    return { isAllowed: false, isLoading: true };
  }

  const currentUser = user || meQuery.data || null;
  return {
    isAllowed: currentUser?.role === "admin",
    isLoading: !currentUser,
  };
}