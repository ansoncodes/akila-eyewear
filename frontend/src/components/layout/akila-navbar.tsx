"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";

import { cartApi, productsApi } from "@/lib/api/services";
import { useAuthStore } from "@/store/auth-store";
import { imageUrl } from "@/lib/utils";

const productPlaceholders = [
  "/images/zeelool-glasses-9nbzZ8ZimU0-unsplash.jpg",
  "/images/zeelool-glasses-eIE2Oikd4E0-unsplash.jpg",
];

interface AkilaNavbarProps {
  collectionsHref?: string;
}

export default function AkilaNavbar({ collectionsHref = "/#collections" }: AkilaNavbarProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const isLoggedIn = Boolean(accessToken);

  const { data: cart } = useQuery({
    queryKey: ["akila-navbar-cart", Boolean(accessToken)],
    queryFn: cartApi.get,
    enabled: Boolean(accessToken),
    retry: false,
  });

  const cartCount = useMemo(() => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 220);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const { data: searchedProducts = [], isFetching: searchLoading } = useQuery({
    queryKey: ["akila-navbar-search", searchTerm],
    queryFn: () => productsApi.list({ search: searchTerm }),
    enabled: searchOpen && searchTerm.length > 0,
    staleTime: 10_000,
  });

  const searchSuggestions = useMemo(() => searchedProducts.slice(0, 6), [searchedProducts]);
  const accountName = useMemo(() => {
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    if (fullName) return fullName;
    if (user?.first_name) return user.first_name;
    if (user?.email) return user.email.split("@")[0];
    return "Account";
  }, [user]);

  const shellClass = scrolled
    ? "bg-[rgba(250,248,245,0.85)] backdrop-blur-[12px] shadow-[0_12px_36px_rgba(63,42,31,0.08)]"
    : "bg-transparent";

  const iconClass = "rounded-full p-2 text-[#2f2823] transition hover:bg-[#f0e3d7]";

  function logout() {
    clearAuth();
    setAccountOpen(false);
    router.push("/");
  }

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-[70] transition-all duration-500 ${shellClass}`}>
        <div className="mx-auto h-20 w-full max-w-[1380px] px-4 sm:px-8 lg:px-12">
          <div className="hidden h-full items-center md:grid md:grid-cols-[1fr_auto_1fr]">
            <Link href="/" className="text-[1.55rem] tracking-[0.08em] text-[#26211d] [font-family:var(--font-heading),serif]">
              AKILA
            </Link>

            <nav className="flex items-center justify-center gap-8 text-[11px] font-medium uppercase tracking-[0.2em] text-[#3e3631]">
              <Link href="/shop" className="transition hover:text-[#C4714F]">
                Shop
              </Link>
              <Link href={collectionsHref} className="transition hover:text-[#C4714F]">
                Collections
              </Link>
            </nav>

            <div className="flex items-center justify-end gap-1">
              <div ref={searchRef} className="relative flex items-center">
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    searchOpen ? "mr-2 w-[300px] opacity-100" : "mr-0 w-0 opacity-0"
                  }`}
                >
                  <input
                    ref={searchInputRef}
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search frames..."
                    className="h-10 w-full rounded-full border border-[#e3d2c4] bg-[#fffaf6] px-4 text-sm text-[#2f2823] outline-none transition focus:border-[#C4714F]"
                  />
                </div>
                <button
                  type="button"
                  className={iconClass}
                  aria-label="Search"
                  onClick={() => setSearchOpen((current) => !current)}
                >
                  <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </button>

                {searchOpen && searchTerm.length > 0 ? (
                  <div className="absolute right-0 top-12 z-[90] w-[320px] overflow-hidden rounded-2xl border border-[#e8d8cb] bg-[#fdf8f2] shadow-[0_20px_45px_rgba(43,30,22,0.16)]">
                    {searchLoading ? (
                      <p className="px-4 py-3 text-xs text-[#7f6d62]">Searching...</p>
                    ) : searchSuggestions.length ? (
                      <ul className="max-h-[290px] overflow-y-auto">
                        {searchSuggestions.map((product) => {
                          const thumb =
                            product.images.find((item) => item.is_primary)?.image ||
                            product.images[0]?.image ||
                            productPlaceholders[0];
                          const thumbSrc = thumb.startsWith?.("/images/") ? thumb : imageUrl(thumb);
                          const isRemote = typeof thumbSrc === "string" && thumbSrc.startsWith("http");

                          return (
                            <li key={product.id} className="border-t border-[#f0e6dd] first:border-t-0">
                              <Link
                                href={`/product/${product.id}`}
                                className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#f6ede4]"
                                onClick={() => {
                                  setSearchOpen(false);
                                  setSearchInput("");
                                  setSearchTerm("");
                                }}
                              >
                                <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-md bg-[#efe4da]">
                                  <Image
                                    src={thumbSrc}
                                    alt={product.name}
                                    fill
                                    sizes="36px"
                                    className="object-cover"
                                    unoptimized={isRemote}
                                  />
                                </div>
                                <span className="truncate text-sm text-[#2f2823]">{product.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="px-4 py-3 text-xs text-[#7f6d62]">No products found</p>
                    )}
                  </div>
                ) : null}
              </div>
              <Link href="/wishlist" className={iconClass} aria-label="Wishlist">
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </Link>
              <Link href="/cart" className={`${iconClass} relative`} aria-label="Cart">
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {cartCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 rounded-full bg-[#C4714F] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </Link>
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  className={iconClass}
                  aria-label="Account"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((current) => !current)}
                >
                  <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </button>
                <AnimatePresence>
                  {accountOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 top-12 z-[95] w-[200px] overflow-hidden rounded-[12px] bg-[#FFFFFF] shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
                    >
                      {isLoggedIn ? (
                        <>
                          <div className="flex items-center gap-2 px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#5a544f] [font-family:Inter,sans-serif]">
                            <User className="h-3.5 w-3.5" strokeWidth={1.7} />
                            <span className="truncate">{accountName}</span>
                          </div>
                          <div className="h-px bg-[#eee]" />
                          <div className="py-1">
                            <Link
                              href="/orders"
                              className="block px-4 py-2 text-sm text-[#2f2823] [font-family:Inter,sans-serif] transition-colors hover:text-[#C4714F]"
                              onClick={() => setAccountOpen(false)}
                            >
                              My Orders
                            </Link>
                            <Link
                              href="/account"
                              className="block px-4 py-2 text-sm text-[#2f2823] [font-family:Inter,sans-serif] transition-colors hover:text-[#C4714F]"
                              onClick={() => setAccountOpen(false)}
                            >
                              Account Settings
                            </Link>
                          </div>
                          <div className="h-px bg-[#eee]" />
                          <div className="py-1">
                            <button
                              type="button"
                              className="block w-full px-4 py-2 text-left text-sm text-[#C4714F] [font-family:Inter,sans-serif] transition-colors hover:text-[#C4714F]"
                              onClick={logout}
                            >
                              Logout
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-1">
                          <Link
                            href="/login"
                            className="block px-4 py-2 text-sm text-[#2f2823] [font-family:Inter,sans-serif] transition-colors hover:text-[#C4714F]"
                            onClick={() => setAccountOpen(false)}
                          >
                            Login
                          </Link>
                          <Link
                            href="/register"
                            className="block px-4 py-2 text-sm text-[#2f2823] [font-family:Inter,sans-serif] transition-colors hover:text-[#C4714F]"
                            onClick={() => setAccountOpen(false)}
                          >
                            Register
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex h-full items-center justify-between md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-full p-2 text-[#2f2823] transition hover:bg-[#f0e3d7]"
              aria-label="Open menu"
            >
              <Menu className="h-[20px] w-[20px]" strokeWidth={1.5} />
            </button>

            <Link href="/" className="text-[1.45rem] tracking-[0.08em] text-[#26211d] [font-family:var(--font-heading),serif]">
              AKILA
            </Link>

            <Link href="/cart" className="relative rounded-full p-2 text-[#2f2823] transition hover:bg-[#f0e3d7]" aria-label="Cart">
              <ShoppingBag className="h-[20px] w-[20px]" strokeWidth={1.5} />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-[#C4714F] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[80] md:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[82%] max-w-[340px] bg-[#FAF8F5] px-6 py-6 shadow-[0_24px_40px_rgba(45,28,20,0.2)] transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <p className="text-[1.4rem] tracking-[0.08em] text-[#26211d] [font-family:var(--font-heading),serif]">AKILA</p>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-full p-2 text-[#2f2823] transition hover:bg-[#f0e3d7]"
              aria-label="Close menu"
            >
              <X className="h-[19px] w-[19px]" strokeWidth={1.5} />
            </button>
          </div>

          <nav className="space-y-5 text-sm uppercase tracking-[0.17em] text-[#3f3732]">
            <Link href="/shop" onClick={() => setMobileOpen(false)} className="block hover:text-[#C4714F]">
              Shop
            </Link>
            <Link href={collectionsHref} onClick={() => setMobileOpen(false)} className="block hover:text-[#C4714F]">
              Collections
            </Link>
            <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="block hover:text-[#C4714F]">
              Wishlist
            </Link>
            <Link href="/cart" onClick={() => setMobileOpen(false)} className="block hover:text-[#C4714F]">
              Cart
            </Link>
            <Link href="/profile" onClick={() => setMobileOpen(false)} className="block hover:text-[#C4714F]">
              Account
            </Link>
            <Link href="/orders" onClick={() => setMobileOpen(false)} className="block hover:text-[#C4714F]">
              Orders
            </Link>
          </nav>
        </aside>
      </div>
    </>
  );
}
