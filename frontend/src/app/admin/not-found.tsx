import Link from "next/link";

export default function AdminNotFoundPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-[#241d18] [font-family:var(--font-heading),serif]">Not Found</h1>
        <p className="mt-1 text-sm text-[#7b6f68]">This admin page is unavailable.</p>
      </div>

      <section className="rounded-2xl border border-[#ece2d9] bg-white p-6 shadow-[0_2px_16px_rgba(63,42,31,0.08)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.16em] text-[#9b8f88]">Error 404</p>
        <h2 className="mt-2 text-3xl text-[#2f2621] [font-family:var(--font-heading),serif]">Admin Route Not Found.</h2>
        <p className="mt-3 max-w-[54ch] text-sm text-[#7b6f68]">
          The route you requested does not exist in the admin panel. Use quick actions below to return safely.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-xl bg-[#C4714F] px-4 py-2 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#b96543]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="rounded-xl border border-[#ddc9bb] bg-white px-4 py-2 text-sm font-semibold text-[#6b594f] transition hover:bg-[#f8eee7]"
          >
            Open Products
          </Link>
        </div>
      </section>
    </div>
  );
}

