export default function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">{children}</div>;
}