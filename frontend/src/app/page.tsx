import Link from "next/link";

import { SectionTitle } from "@/components/ui/section-title";

const highlights = [
  {
    title: "Architectural Frames",
    text: "Premium acetate and metal silhouettes tailored for daily confidence.",
  },
  {
    title: "Interactive 3D Detail",
    text: "Rotate every frame before you buy with high-fidelity GLB previews.",
  },
  {
    title: "Virtual Face Try-On",
    text: "Use your camera to see fit and stance with calibrated model placement.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-8 rounded-3xl border border-slate-800 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.62))] p-8 md:grid-cols-[1.3fr_1fr] md:p-12">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Akila Studio</p>
          <h1 className="text-5xl leading-none text-white md:text-7xl">
            Eyewear Built
            <br />
            For Presence
          </h1>
          <p className="max-w-xl text-base text-slate-200/90 md:text-lg">
            Discover statement frames, inspect every angle in 3D, and preview fit with real-time virtual try-on.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950">
              Shop Frames
            </Link>
            <Link
              href="/try-on/1"
              className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try On Live
            </Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <img
            src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80"
            alt="Eyewear hero"
            className="h-full min-h-[300px] w-full rounded-xl object-cover"
          />
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle title="Why Akila" subtitle="Designed for premium discovery and fast conversion." />
        <div className="grid gap-5 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h3 className="text-2xl text-white">{item.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
