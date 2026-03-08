export default function AdminLoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-sm text-slate-300">
      {label}
    </div>
  );
}