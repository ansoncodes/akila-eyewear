import { cn } from "@/lib/utils";

export default function AdminPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-[#ece2d9] bg-white p-5 shadow-[0_2px_16px_rgba(63,42,31,0.08)]", className)}>
      {children}
    </section>
  );
}
