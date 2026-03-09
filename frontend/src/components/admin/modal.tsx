"use client";

export default function AdminModal({
  open,
  title,
  onClose,
  children,
  tone = "dark",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  tone?: "dark" | "warm";
}) {
  if (!open) return null;

  const isWarm = tone === "warm";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isWarm ? "bg-[#24180f]/45" : "bg-slate-950/85"}`}>
      <div
        className={`w-full max-w-2xl rounded-2xl border p-5 ${
          isWarm
            ? "border-[#e8d9cc] bg-[#faf8f5] text-[#2f2621] shadow-[0_24px_60px_rgba(63,42,31,0.2)]"
            : "border-slate-700 bg-slate-900 text-slate-100"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-xl font-semibold ${isWarm ? "text-[#2f2621]" : "text-white"}`}>{title}</h2>
          <button
            onClick={onClose}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${
              isWarm
                ? "border border-[#ddc9bb] bg-white text-[#6b594f] hover:bg-[#f8eee7]"
                : "border border-slate-600 text-slate-300"
            }`}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
