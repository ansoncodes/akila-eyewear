"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth-store";
import { useAdminUiStore } from "@/store/admin-ui-store";

export default function AdminTopbar() {
  const router = useRouter();
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setGlobalSearch = useAdminUiStore((state) => state.setGlobalSearch);

  useEffect(() => {
    setGlobalSearch("");
  }, [setGlobalSearch]);

  async function logout() {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore network/logout revoke errors and clear local auth regardless.
      }
    }
    clearAuth();
    queryClient.clear();
    router.push("/admin/login");
  }

  return (
    <header className="sticky top-0 z-20 bg-[#FAF8F5] px-6 py-4 sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[1.35rem] tracking-[0.08em] text-[#26211d] [font-family:var(--font-heading),serif] lg:hidden">
          AKILA ADMIN
        </p>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={logout}
            className="rounded-xl bg-[#C4714F] px-3 py-2 text-sm font-semibold text-[#fff8f2] shadow-[0_10px_24px_rgba(196,113,79,0.3)] hover:bg-[#b96543]"
            type="button"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
