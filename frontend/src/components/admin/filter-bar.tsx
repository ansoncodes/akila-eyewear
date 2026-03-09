export default function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-[#ece2d9] bg-white p-3 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
      {children}
    </div>
  );
}
