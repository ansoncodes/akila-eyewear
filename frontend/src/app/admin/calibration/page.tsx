"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import DataTable from "@/components/admin/data-table";
import AdminErrorState from "@/components/admin/error-state";
import FilterBar from "@/components/admin/filter-bar";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminModal from "@/components/admin/modal";
import AdminPageHeader from "@/components/admin/page-header";
import StatusBadge from "@/components/admin/status-badge";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { queryClient } from "@/lib/query-client";
import { formatDate } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui-store";
import type { AdminGlassesModel } from "@/types/admin";

interface ManualForm {
  glb_file_url: string;
  scale: string;
  position_x: string;
  position_y: string;
  position_z: string;
  rotation_x: string;
  rotation_y: string;
  rotation_z: string;
}

function modelToForm(model: AdminGlassesModel): ManualForm {
  return {
    glb_file_url: model.glb_file_url,
    scale: String(model.scale),
    position_x: String(model.position_x),
    position_y: String(model.position_y),
    position_z: String(model.position_z),
    rotation_x: String(model.rotation_x),
    rotation_y: String(model.rotation_y),
    rotation_z: String(model.rotation_z),
  };
}

export default function AdminCalibrationPage() {
  const globalSearch = useAdminUiStore((state) => state.globalSearch);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [editing, setEditing] = useState<AdminGlassesModel | null>(null);
  const [manualForm, setManualForm] = useState<ManualForm | null>(null);

  const modelsQuery = useQuery({
    queryKey: queryKeys.adminGlassesModels(),
    queryFn: adminApi.glassesModels,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.adminProducts(),
    queryFn: () => adminApi.products(),
  });

  const productNameById = useMemo(() => {
    const map = new Map<number, string>();
    (productsQuery.data ?? []).forEach((product) => map.set(product.id, product.name));
    return map;
  }, [productsQuery.data]);

  const filtered = useMemo(() => {
    return (modelsQuery.data ?? []).filter((model) => {
      const productName = productNameById.get(model.product) ?? "";
      const matchesSearch = globalSearch
        ? `${productName} ${model.glb_file_url}`.toLowerCase().includes(globalSearch.toLowerCase())
        : true;
      const matchesStatus = statusFilter ? model.calibration_status === statusFilter : true;
      const matchesSource = sourceFilter ? model.calibration_source === sourceFilter : true;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [modelsQuery.data, productNameById, globalSearch, statusFilter, sourceFilter]);

  const runOneMutation = useMutation({
    mutationFn: (id: number) => adminApi.runCalibration(id),
    onSuccess: () => {
      toast.success("Calibration completed");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminGlassesModels() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts() });
    },
    onError: () => toast.error("Calibration failed"),
  });

  const runBulkMutation = useMutation({
    mutationFn: (ids: number[]) => adminApi.runCalibrationBulk({ ids }),
    onSuccess: () => {
      toast.success("Bulk calibration completed");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminGlassesModels() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts() });
      setSelected([]);
    },
    onError: () => toast.error("Bulk calibration failed"),
  });

  const updateManualMutation = useMutation({
    mutationFn: async () => {
      if (!editing || !manualForm) return;
      return adminApi.updateGlassesModel(editing.id, {
        product: editing.product,
        glb_file_url: manualForm.glb_file_url,
        scale: Number(manualForm.scale || 1),
        position_x: Number(manualForm.position_x || 0),
        position_y: Number(manualForm.position_y || 0),
        position_z: Number(manualForm.position_z || 0),
        rotation_x: Number(manualForm.rotation_x || 0),
        rotation_y: Number(manualForm.rotation_y || 0),
        rotation_z: Number(manualForm.rotation_z || 0),
      });
    },
    onSuccess: () => {
      toast.success("Calibration values updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminGlassesModels() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts() });
      setEditing(null);
      setManualForm(null);
    },
    onError: () => toast.error("Unable to update calibration"),
  });

  if (modelsQuery.isLoading || productsQuery.isLoading) {
    return <AdminLoadingState label="Loading calibration models..." />;
  }

  if (modelsQuery.isError || productsQuery.isError) {
    return <AdminErrorState description="Unable to load calibration models." />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="3D Calibration"
        subtitle="Control manual and auto-calculated calibration values for virtual try-on alignment."
        action={
          <button
            type="button"
            disabled={selected.length === 0 || runBulkMutation.isPending}
            onClick={() => runBulkMutation.mutate(selected)}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            Run Auto Calibration (Selected)
          </button>
        }
      />

      <FilterBar>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">All Sources</option>
          <option value="manual">Manual</option>

          <option value="fallback">Fallback</option>
        </select>
      </FilterBar>

      <DataTable
        columns={[
          {
            key: "select",
            label: "",
            render: (row) => (
              <input
                type="checkbox"
                checked={selected.includes(row.id)}
                onChange={(event) => {
                  setSelected((prev) => {
                    if (event.target.checked) return [...prev, row.id];
                    return prev.filter((id) => id !== row.id);
                  });
                }}
              />
            ),
          },
          {
            key: "product",
            label: "Product",
            render: (row) => (
              <div>
                <p>{productNameById.get(row.product) ?? `Product #${row.product}`}</p>
                <p className="text-xs text-slate-400">Model #{row.id}</p>
              </div>
            ),
          },
          {
            key: "glb",
            label: "GLB URL",
            render: (row) => <span className="text-xs">{row.glb_file_url}</span>,
          },
          {
            key: "scale",
            label: "Scale/Position",
            render: (row) => (
              <div className="text-xs text-slate-300">
                <p>S: {row.scale.toFixed(3)}</p>
                <p>
                  P: {row.position_x.toFixed(3)}, {row.position_y.toFixed(3)}, {row.position_z.toFixed(3)}
                </p>
              </div>
            ),
          },
          {
            key: "rotation",
            label: "Rotation",
            render: (row) => (
              <p className="text-xs text-slate-300">
                {row.rotation_x.toFixed(3)}, {row.rotation_y.toFixed(3)}, {row.rotation_z.toFixed(3)}
              </p>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <div className="space-y-1">
                <StatusBadge value={row.calibration_status} />
                <StatusBadge value={row.calibration_source} />
              </div>
            ),
          },
          {
            key: "last",
            label: "Last Calibrated",
            render: (row) => <span className="text-xs">{row.last_calibrated_at ? formatDate(row.last_calibrated_at) : "N/A"}</span>,
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runOneMutation.mutate(row.id)}
                  className="rounded-lg border border-cyan-700/70 px-2 py-1 text-xs text-cyan-200"
                >
                  Re-run Auto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(row);
                    setManualForm(modelToForm(row));
                  }}
                  className="rounded-lg border border-slate-700 px-2 py-1 text-xs"
                >
                  Manual Edit
                </button>
                <Link
                  href={`/try-on/${row.product}`}
                  target="_blank"
                  className="rounded-lg border border-slate-700 px-2 py-1 text-xs"
                >
                  Preview
                </Link>
              </div>
            ),
          },
          {
            key: "error",
            label: "Error",
            render: (row) => (
              <p className="max-w-[240px] text-xs text-rose-200">{row.calibration_error || "-"}</p>
            ),
          },
        ]}
        rows={filtered}
        rowKey={(row) => row.id}
        emptyLabel="No glasses models available for calibration."
      />

      <AdminModal open={Boolean(editing && manualForm)} onClose={() => setEditing(null)} title="Manual Calibration">
        {manualForm ? (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              updateManualMutation.mutate();
            }}
          >
            <input
              value={manualForm.glb_file_url}
              onChange={(event) => setManualForm((prev) => (prev ? { ...prev, glb_file_url: event.target.value } : null))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              value={manualForm.scale}
              onChange={(event) => setManualForm((prev) => (prev ? { ...prev, scale: event.target.value } : null))}
              placeholder="Scale"
              type="number"
              step="0.001"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={manualForm.position_x}
              onChange={(event) => setManualForm((prev) => (prev ? { ...prev, position_x: event.target.value } : null))}
              placeholder="Position X"
              type="number"
              step="0.001"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={manualForm.position_y}
              onChange={(event) => setManualForm((prev) => (prev ? { ...prev, position_y: event.target.value } : null))}
              placeholder="Position Y"
              type="number"
              step="0.001"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={manualForm.position_z}
              onChange={(event) => setManualForm((prev) => (prev ? { ...prev, position_z: event.target.value } : null))}
              placeholder="Position Z"
              type="number"
              step="0.001"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={manualForm.rotation_x}
              onChange={(event) => setManualForm((prev) => (prev ? { ...prev, rotation_x: event.target.value } : null))}
              placeholder="Rotation X"
              type="number"
              step="0.001"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={manualForm.rotation_y}
              onChange={(event) => setManualForm((prev) => (prev ? { ...prev, rotation_y: event.target.value } : null))}
              placeholder="Rotation Y"
              type="number"
              step="0.001"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={manualForm.rotation_z}
              onChange={(event) => setManualForm((prev) => (prev ? { ...prev, rotation_z: event.target.value } : null))}
              placeholder="Rotation Z"
              type="number"
              step="0.001"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={updateManualMutation.isPending}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 sm:col-span-2"
            >
              Save Calibration
            </button>
          </form>
        ) : null}
      </AdminModal>
    </div>
  );
}


