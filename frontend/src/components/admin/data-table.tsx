import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyLabel = "No records found.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ece2d9] bg-white shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead className="bg-[#f7efe8]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8f88]">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-[#8a7c73]">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="border-t border-[#efe3d9] align-top transition hover:bg-[#fcf8f4]">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-3 text-sm text-[#3a312b]", column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
