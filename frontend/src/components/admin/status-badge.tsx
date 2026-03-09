import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-[#f7e7de] text-[#a76040]",
  success: "bg-[#e9f5ee] text-[#2d7d55]",
  failed: "bg-[#fce9e9] text-[#b34848]",
  manual: "bg-[#f2ece5] text-[#6b594f]",
  fallback: "bg-[#f2ece5] text-[#6b594f]",
  paid: "bg-[#e9f5ee] text-[#2d7d55]",
  confirmed: "bg-[#f2ece5] text-[#6b594f]",
  shipped: "bg-[#f2ece5] text-[#6b594f]",
  delivered: "bg-[#e9f5ee] text-[#2d7d55]",
  cancelled: "bg-[#fce9e9] text-[#b34848]",
  active: "bg-[#e9f5ee] text-[#2d7d55]",
  inactive: "bg-[#f7e7de] text-[#a76040]",
  read: "bg-[#e9f5ee] text-[#2d7d55]",
  unread: "bg-[#f7e7de] text-[#a76040]",
};

export default function StatusBadge({ value }: { value: string }) {
  const key = value.toLowerCase();
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", styles[key] ?? "bg-[#f2ece5] text-[#6b594f]")}>
      {value}
    </span>
  );
}
