import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Akila Eyewear. Crafted frames and immersive try-on.</p>
        <div className="flex items-center gap-4">
          <Link href="/shop" className="hover:text-white">
            Shop
          </Link>
          <Link href="/wishlist" className="hover:text-white">
            Wishlist
          </Link>
          <Link href="/orders" className="hover:text-white">
            Orders
          </Link>
        </div>
      </div>
    </footer>
  );
}
