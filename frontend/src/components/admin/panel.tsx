import { cn } from "@/lib/utils";

export default function AdminPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("rounded-2xl border border-slate-800 bg-slate-900/70 p-5", className)}>{children}</section>;
}