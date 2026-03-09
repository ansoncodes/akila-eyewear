export default function AdminErrorState({
  title = "Something went wrong",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#f0cfcd] bg-[#fdf2f2] p-6 text-sm text-[#b34848]">
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-1">{description}</p> : null}
    </div>
  );
}
