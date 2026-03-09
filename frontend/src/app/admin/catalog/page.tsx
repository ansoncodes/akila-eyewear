"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import AdminErrorState from "@/components/admin/error-state";
import AdminLoadingState from "@/components/admin/loading-state";
import AdminModal from "@/components/admin/modal";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { queryClient } from "@/lib/query-client";
import { imageUrl } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui-store";
import type { AdminCollection } from "@/types/admin";
import type { Category, FrameMaterial, FrameShape } from "@/types/api";

type TabKey = "categories" | "collections" | "frame-shapes" | "frame-materials";

const fieldClass =
  "rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#3d3129] placeholder:text-[#a18f84] focus:border-[#d9b8a5] focus:outline-none focus:ring-2 focus:ring-[#edd6c8]";
const checkboxRowClass = "flex items-center gap-2 rounded-xl border border-[#e6d6c9] bg-white px-3 py-2 text-sm text-[#4f423a]";
const warmPrimaryButtonClass =
  "rounded-xl bg-[#C4714F] px-4 py-2 text-sm font-semibold text-[#fff8f2] shadow-[0_10px_24px_rgba(196,113,79,0.3)] hover:bg-[#b96543] disabled:opacity-60";
const warmSoftButtonClass = "rounded-lg border border-[#ddc9bb] bg-white px-2.5 py-1 text-xs text-[#6b594f] hover:bg-[#f8eee7]";
const warmDangerButtonClass = "rounded-lg border border-[#f0cfcd] bg-[#fdf2f2] px-2.5 py-1 text-xs text-[#b34848] hover:bg-[#fae5e5]";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-[#241d18] [font-family:var(--font-heading),serif]">Catalog Meta</h1>
        <p className="mt-1 text-sm text-[#7b6f68]">Manage categories, collections, frame shapes, and materials.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#ece2d9] bg-white p-3 shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
        <select
          value={tab}
          onChange={(event) => setTab(event.target.value as TabKey)}
          className={fieldClass}
        >
          <option value="categories">Categories</option>
          <option value="collections">Collections</option>
          <option value="frame-shapes">Frame Shapes</option>
          <option value="frame-materials">Frame Materials</option>
        </select>
      </div>

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
          className={`w-full ${fieldClass}`}
        />
        <button type="submit" className={warmPrimaryButtonClass}>
          Add
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[#ece2d9] bg-white shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead className="bg-[#f7efe8]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8f88]">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8f88]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-10 text-center text-sm text-[#8a7c73]">
                    No records found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#efe3d9] align-top transition hover:bg-[#fcf8f4]">
                    <td className="px-4 py-3 text-sm text-[#3a312b]">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing({ id: row.id, name: row.name })}
                          className={warmSoftButtonClass}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(row.id)}
                          className={warmDangerButtonClass}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Edit ${title}`} tone="warm">
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
            className={`w-full ${fieldClass}`}
          />
          <button type="submit" className={warmPrimaryButtonClass}>
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
          className={fieldClass}
          required
        />
        <input
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Description"
          className={fieldClass}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))}
          className={fieldClass}
        />
        <label className={checkboxRowClass}>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
          />
          Active
        </label>
        <button type="submit" className={`${warmPrimaryButtonClass} sm:col-span-2`}>
          Add Collection
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[#ece2d9] bg-white shadow-[0_2px_16px_rgba(63,42,31,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-[#f7efe8]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8f88]">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8f88]">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8f88]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-[#8a7c73]">
                    No records found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-t border-[#efe3d9] align-top transition hover:bg-[#fcf8f4]">
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <div className="flex items-center gap-3">
                        {row.image ? <img src={imageUrl(row.image)} alt={row.name} className="h-10 w-16 rounded object-cover" /> : null}
                        <div>
                          <p className="font-medium text-[#2f2621]">{row.name}</p>
                          <p className="text-xs text-[#8a7c73]">{row.description || "No description"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.is_active ? "bg-[#e9f5ee] text-[#2d7d55]" : "bg-[#f7e7de] text-[#a76040]"
                        }`}
                      >
                        {row.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3a312b]">
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
                          className={warmSoftButtonClass}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(row.id)}
                          className={warmDangerButtonClass}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit Collection" tone="warm">
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
            className={`w-full ${fieldClass}`}
          />
          <textarea
            value={editingForm.description}
            onChange={(event) => setEditingForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            className={`w-full ${fieldClass}`}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setEditingForm((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))}
            className={`w-full ${fieldClass}`}
          />
          <label className={checkboxRowClass}>
            <input
              type="checkbox"
              checked={editingForm.is_active}
              onChange={(event) => setEditingForm((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            Active
          </label>
          <button type="submit" className={warmPrimaryButtonClass}>
            Save Changes
          </button>
        </form>
      </AdminModal>
    </div>
  );
}

