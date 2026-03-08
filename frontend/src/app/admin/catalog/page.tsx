"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import DataTable from "@/components/admin/data-table";
import AdminErrorState from "@/components/admin/error-state";
import FilterBar from "@/components/admin/filter-bar";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminModal from "@/components/admin/modal";
import AdminPageHeader from "@/components/admin/page-header";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { queryClient } from "@/lib/query-client";
import { imageUrl } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui-store";
import type { AdminCollection } from "@/types/admin";
import type { Category, FrameMaterial, FrameShape } from "@/types/api";

type TabKey = "categories" | "collections" | "frame-shapes" | "frame-materials";

export default function AdminCatalogPage() {
  const globalSearch = useAdminUiStore((state) => state.globalSearch);
  const [tab, setTab] = useState<TabKey>("categories");

  const categoriesQuery = useQuery({ queryKey: queryKeys.adminCategories, queryFn: adminApi.categories });
  const collectionsQuery = useQuery({ queryKey: queryKeys.adminCollections, queryFn: adminApi.collections });
  const frameShapesQuery = useQuery({ queryKey: queryKeys.adminFrameShapes, queryFn: adminApi.frameShapes });
  const frameMaterialsQuery = useQuery({
    queryKey: queryKeys.adminFrameMaterials,
    queryFn: adminApi.frameMaterials,
  });

  const loading =
    categoriesQuery.isLoading || collectionsQuery.isLoading || frameShapesQuery.isLoading || frameMaterialsQuery.isLoading;

  const error =
    categoriesQuery.isError || collectionsQuery.isError || frameShapesQuery.isError || frameMaterialsQuery.isError;

  if (loading) {
    return <AdminLoadingState label="Loading catalog metadata..." />;
  }

  if (error) {
    return <AdminErrorState description="Unable to load catalog metadata." />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Catalog Meta" subtitle="Manage categories, collections, frame shapes, and materials." />

      <FilterBar>
        <select
          value={tab}
          onChange={(event) => setTab(event.target.value as TabKey)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="categories">Categories</option>
          <option value="collections">Collections</option>
          <option value="frame-shapes">Frame Shapes</option>
          <option value="frame-materials">Frame Materials</option>
        </select>
      </FilterBar>

      {tab === "categories" ? (
        <NamedEntityManager
          title="Categories"
          rows={(categoriesQuery.data ?? []).filter((item) =>
            item.name.toLowerCase().includes(globalSearch.toLowerCase())
          )}
          create={(name) => adminApi.createCategory({ name })}
          update={(id, name) => adminApi.updateCategory(id, { name })}
          remove={(id) => adminApi.deleteCategory(id)}
          queryKey={queryKeys.adminCategories}
        />
      ) : null}

      {tab === "collections" ? <CollectionManager rows={collectionsQuery.data ?? []} globalSearch={globalSearch} /> : null}

      {tab === "frame-shapes" ? (
        <NamedEntityManager
          title="Frame Shapes"
          rows={(frameShapesQuery.data ?? []).filter((item) =>
            item.name.toLowerCase().includes(globalSearch.toLowerCase())
          )}
          create={(name) => adminApi.createFrameShape({ name })}
          update={(id, name) => adminApi.updateFrameShape(id, { name })}
          remove={(id) => adminApi.deleteFrameShape(id)}
          queryKey={queryKeys.adminFrameShapes}
        />
      ) : null}

      {tab === "frame-materials" ? (
        <NamedEntityManager
          title="Frame Materials"
          rows={(frameMaterialsQuery.data ?? []).filter((item) =>
            item.name.toLowerCase().includes(globalSearch.toLowerCase())
          )}
          create={(name) => adminApi.createFrameMaterial({ name })}
          update={(id, name) => adminApi.updateFrameMaterial(id, { name })}
          remove={(id) => adminApi.deleteFrameMaterial(id)}
          queryKey={queryKeys.adminFrameMaterials}
        />
      ) : null}
    </div>
  );
}

function NamedEntityManager({
  title,
  rows,
  create,
  update,
  remove,
  queryKey,
}: {
  title: string;
  rows: Category[] | FrameShape[] | FrameMaterial[];
  create: (name: string) => Promise<unknown>;
  update: (id: number, name: string) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
  queryKey: readonly unknown[];
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);

  const createMutation = useMutation({
    mutationFn: () => create(name),
    onSuccess: () => {
      toast.success(`${title} created`);
      setName("");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error(`Unable to create ${title.toLowerCase()}`),
  });

  const updateMutation = useMutation({
    mutationFn: () => update(editing!.id, editing!.name),
    onSuccess: () => {
      toast.success(`${title} updated`);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error(`Unable to update ${title.toLowerCase()}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      toast.success(`${title} deleted`);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error(`Unable to delete ${title.toLowerCase()}`),
  });

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          createMutation.mutate();
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={`Add ${title}`}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950">
          Add
        </button>
      </form>

      <DataTable
        columns={[
          {
            key: "name",
            label: "Name",
            render: (row) => <span>{row.name}</span>,
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing({ id: row.id, name: row.name })}
                  className="rounded-lg border border-slate-700 px-2 py-1 text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(row.id)}
                  className="rounded-lg border border-rose-700/70 px-2 py-1 text-xs text-rose-200"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
      />

      <AdminModal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Edit ${title}`}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate();
          }}
        >
          <input
            value={editing?.name ?? ""}
            onChange={(event) =>
              setEditing((prev) => {
                if (!prev) return null;
                return { ...prev, name: event.target.value };
              })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950">
            Save
          </button>
        </form>
      </AdminModal>
    </div>
  );
}

function CollectionManager({ rows, globalSearch }: { rows: AdminCollection[]; globalSearch: string }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
    image: null as File | null,
  });
  const [editing, setEditing] = useState<AdminCollection | null>(null);
  const [editingForm, setEditingForm] = useState({
    name: "",
    description: "",
    is_active: true,
    image: null as File | null,
  });

  const filtered = useMemo(
    () => rows.filter((row) => row.name.toLowerCase().includes(globalSearch.toLowerCase())),
    [rows, globalSearch]
  );

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createCollection({
        name: form.name,
        description: form.description,
        is_active: form.is_active,
        image: form.image,
      }),
    onSuccess: () => {
      toast.success("Collection created");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCollections });
      setForm({ name: "", description: "", is_active: true, image: null });
    },
    onError: () => toast.error("Unable to create collection"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updateCollection(editing!.id, {
        name: editingForm.name,
        description: editingForm.description,
        is_active: editingForm.is_active,
        image: editingForm.image,
      }),
    onSuccess: () => {
      toast.success("Collection updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCollections });
      setEditing(null);
      setEditingForm({ name: "", description: "", is_active: true, image: null });
    },
    onError: () => toast.error("Unable to update collection"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteCollection(id),
    onSuccess: () => {
      toast.success("Collection deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCollections });
    },
    onError: () => toast.error("Unable to delete collection"),
  });

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name.trim()) return;
          createMutation.mutate();
        }}
      >
        <input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Collection name"
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          required
        />
        <input
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Description"
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
          />
          Active
        </label>
        <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 sm:col-span-2">
          Add Collection
        </button>
      </form>

      <DataTable
        columns={[
          {
            key: "name",
            label: "Name",
            render: (row) => (
              <div className="flex items-center gap-3">
                {row.image ? <img src={imageUrl(row.image)} alt={row.name} className="h-10 w-16 rounded object-cover" /> : null}
                <div>
                  <p className="text-white">{row.name}</p>
                  <p className="text-xs text-slate-400">{row.description || "No description"}</p>
                </div>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => <span>{row.is_active ? "Active" : "Inactive"}</span>,
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(row);
                    setEditingForm({
                      name: row.name,
                      description: row.description,
                      is_active: row.is_active,
                      image: null,
                    });
                  }}
                  className="rounded-lg border border-slate-700 px-2 py-1 text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(row.id)}
                  className="rounded-lg border border-rose-700/70 px-2 py-1 text-xs text-rose-200"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={filtered}
        rowKey={(row) => row.id}
      />

      <AdminModal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit Collection">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate();
          }}
        >
          <input
            value={editingForm.name}
            onChange={(event) => setEditingForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <textarea
            value={editingForm.description}
            onChange={(event) => setEditingForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setEditingForm((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={editingForm.is_active}
              onChange={(event) => setEditingForm((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            Active
          </label>
          <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950">
            Save Changes
          </button>
        </form>
      </AdminModal>
    </div>
  );
}