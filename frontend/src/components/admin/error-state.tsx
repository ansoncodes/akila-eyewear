export default function AdminErrorState({
  title = "Something went wrong",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-rose-700/40 bg-rose-950/20 p-6 text-sm text-rose-200">
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-1">{description}</p> : null}
    </div>
  );
}