"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { authApi } from "@/lib/api/services";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/orders", label: "Orders" },
  { href: "/notifications", label: "Notifications" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

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
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-[rgba(7,14,20,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-semibold tracking-wide text-white">
          AKILA
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium text-white/70 transition hover:text-white",
                pathname.startsWith(item.href) && "text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/profile"
                className="rounded-full border border-white/30 px-3 py-1.5 text-sm text-white/90 hover:border-white"
              >
                {user.first_name || "Profile"}
              </Link>
              <button
                onClick={logout}
                className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-black"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-white/85 hover:text-white">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-black"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
