import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-200",
  success: "bg-emerald-500/20 text-emerald-200",
  failed: "bg-rose-500/20 text-rose-200",
  manual: "bg-slate-500/30 text-slate-100",
  fallback: "bg-fuchsia-500/20 text-fuchsia-200",
  paid: "bg-emerald-500/20 text-emerald-200",
  confirmed: "bg-cyan-500/20 text-cyan-200",
  shipped: "bg-indigo-500/20 text-indigo-200",
  delivered: "bg-emerald-500/20 text-emerald-200",
  cancelled: "bg-rose-500/20 text-rose-200",
};

export default function StatusBadge({ value }: { value: string }) {
  const key = value.toLowerCase();
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", styles[key] ?? "bg-slate-700 text-slate-100")}>
      {value}
    </span>
  );
}
