"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthStore } from "@/store/auth-store";

export function useBootstrapAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled: Boolean(accessToken),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (meQuery.isError) {
      clearAuth();
    }
  }, [meQuery.isError, clearAuth]);
}
