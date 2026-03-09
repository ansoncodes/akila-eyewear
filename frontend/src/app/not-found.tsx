import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-[#FAF8F5] px-4 pb-16 pt-28 text-[#2a241f] sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1380px] items-center">
        <section className="w-full rounded-3xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:p-12">
          <p className="text-xs uppercase tracking-[0.18em] text-[#9b8f88]">Error 404</p>
          <h1 className="mt-3 text-5xl text-[#241d18] [font-family:var(--font-heading),serif] sm:text-6xl">
            Page Not Found.
          </h1>
          <p className="mt-4 max-w-[48ch] text-sm text-[#7b6f68] sm:text-base">
            The page you are looking for does not exist or may have moved. Continue browsing our collection from here.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-[#C4714F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b66342]"
            >
              Back to Home
            </Link>
            <Link
              href="/shop"
              className="rounded-full border border-[#d8c8bb] px-6 py-2.5 text-sm font-semibold text-[#5a4c43] transition hover:border-[#C4714F] hover:text-[#C4714F]"
            >
              Explore Shop
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

