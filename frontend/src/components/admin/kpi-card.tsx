import { cn } from "@/lib/utils";

export default function KpiCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-700/60"
      : tone === "warn"
        ? "border-amber-700/60"
        : "border-slate-800";

  return (
    <div className={cn("rounded-2xl border bg-slate-900/70 p-4", toneClass)}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}