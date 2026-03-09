"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import AdminErrorState from "@/components/admin/error-state";
import AdminLoadingState from "@/components/admin/loading-state";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { formatDate, formatPrice } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui-store";

const fieldClass =
  "w-full rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129] placeholder:text-[#a18f84] focus:border-[#d9b8a5] focus:outline-none focus:ring-2 focus:ring-[#edd6c8] sm:w-80";

export default function AdminCustomersPage() {
  const globalSearch = useAdminUiStore((state) => state.globalSearch);
  const [localSearch, setLocalSearch] = useState("");

  const queryText = localSearch || globalSearch;

  const customersQuery = useQuery({
    queryKey: queryKeys.adminCustomers({ q: queryText }),
    queryFn: () => adminApi.customers({ q: queryText || undefined }),
    placeholderData: keepPreviousData,
  });

  const filtered = useMemo(() => {
    return (customersQuery.data ?? []).filter((customer) => {
      if (!queryText) return true;
      return `${customer.first_name} ${customer.last_name} ${customer.email}`
        .toLowerCase()
        .includes(queryText.toLowerCase());
    });
  }, [customersQuery.data, queryText]);

  if (customersQuery.isPending && !customersQuery.data) {
    return <AdminLoadingState label="Loading customers..." />;
  }

  if (customersQuery.isError) {
    return <AdminErrorState description="Unable to load customer list." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-[#241d18] [font-family:var(--font-heading),serif]">Customers</h1>
        <p className="mt-1 text-sm text-[#7b6f68]">Track customer profiles, spend and engagement.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#ece2d9] bg-white p-3 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
        <input
          value={localSearch}
          onChange={(event) => setLocalSearch(event.target.value)}
          placeholder="Search customer by name or email"
          className={fieldClass}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#ece2d9] bg-white shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-[#f7efe8]">
              <tr>
                {["Name", "Role", "Joined", "Total Orders", "Total Spend", "Reviews", "Actions"].map((label) => (
                  <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8f88]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#8a7c73]">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-t border-[#efe3d9] align-top transition hover:bg-[#fcf8f4]">
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <div>
                        <p className="font-medium text-[#2f2621]">{`${row.first_name} ${row.last_name}`.trim() || "Unnamed"}</p>
                        <p className="text-xs text-[#8a7c73]">{row.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">{row.role}</td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <span className="text-xs text-[#8a7c73]">{formatDate(row.date_joined)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">{row.order_count}</td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">{formatPrice(row.total_spend || "0")}</td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">{row.review_count}</td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <Link
                        href={`/admin/customers/${row.id}`}
                        className="rounded-lg border border-[#ddc9bb] bg-white px-2.5 py-1 text-xs text-[#6b594f] hover:bg-[#f8eee7]"
                      >
                        View Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

