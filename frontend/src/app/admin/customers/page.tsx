"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import DataTable from "@/components/admin/data-table";
import AdminErrorState from "@/components/admin/error-state";
import FilterBar from "@/components/admin/filter-bar";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminPageHeader from "@/components/admin/page-header";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { formatDate, formatPrice } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui-store";

export default function AdminCustomersPage() {
  const globalSearch = useAdminUiStore((state) => state.globalSearch);
  const [localSearch, setLocalSearch] = useState("");

  const queryText = localSearch || globalSearch;

  const customersQuery = useQuery({
    queryKey: queryKeys.adminCustomers({ q: queryText }),
    queryFn: () => adminApi.customers({ q: queryText || undefined }),
  });

  const filtered = useMemo(() => {
    return (customersQuery.data ?? []).filter((customer) => {
      if (!queryText) return true;
      return `${customer.first_name} ${customer.last_name} ${customer.email}`
        .toLowerCase()
        .includes(queryText.toLowerCase());
    });
  }, [customersQuery.data, queryText]);

  if (customersQuery.isLoading) {
    return <AdminLoadingState label="Loading customers..." />;
  }

  if (customersQuery.isError) {
    return <AdminErrorState description="Unable to load customer list." />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Customers" subtitle="Track customer profiles, spend and engagement." />

      <FilterBar>
        <input
          value={localSearch}
          onChange={(event) => setLocalSearch(event.target.value)}
          placeholder="Search customer by name or email"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm sm:w-80"
        />
      </FilterBar>

      <DataTable
        columns={[
          {
            key: "name",
            label: "Name",
            render: (row) => (
              <div>
                <p className="text-white">{`${row.first_name} ${row.last_name}`.trim() || "Unnamed"}</p>
                <p className="text-xs text-slate-400">{row.email}</p>
              </div>
            ),
          },
          {
            key: "role",
            label: "Role",
            render: (row) => <span>{row.role}</span>,
          },
          {
            key: "joined",
            label: "Joined",
            render: (row) => <span className="text-xs">{formatDate(row.date_joined)}</span>,
          },
          {
            key: "orders",
            label: "Total Orders",
            render: (row) => <span>{row.order_count}</span>,
          },
          {
            key: "spend",
            label: "Total Spend",
            render: (row) => <span>{formatPrice(row.total_spend || "0")}</span>,
          },
          {
            key: "reviews",
            label: "Reviews",
            render: (row) => <span>{row.review_count}</span>,
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <Link href={`/admin/customers/${row.id}`} className="rounded-lg border border-slate-700 px-2 py-1 text-xs">
                View Detail
              </Link>
            ),
          },
        ]}
        rows={filtered}
        rowKey={(row) => row.id}
        emptyLabel="No customers found."
      />
    </div>
  );
}