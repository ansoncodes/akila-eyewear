export default function AdminLoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-[#ece2d9] bg-white p-8 text-center text-sm text-[#8a7c73] shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
      {label}
    </div>
  );
}
