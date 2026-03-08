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
import StatusBadge from "@/components/admin/status-badge";
import { queryKeys } from "@/lib/api/query-keys";
import { adminApi } from "@/lib/api/admin/services";
import { queryClient } from "@/lib/query-client";
import { imageUrl } from "@/lib/utils";
import { useAdminUiStore } from "@/store/admin-ui-store";
import type { AdminProduct, AdminProductPayload, GlassesModelPayload } from "@/types/admin";

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  discount_price: string;
  category: string;
  collection: string;
  frame_shape: string;
  frame_material: string;
  gender: "Men" | "Women" | "Unisex";
  is_active: boolean;
  glb_file_url: string;
  scale: string;
  position_x: string;
  position_y: string;
  position_z: string;
  rotation_x: string;
  rotation_y: string;
  rotation_z: string;
}

const defaultForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  discount_price: "",
  category: "",
  collection: "",
  frame_shape: "",
  frame_material: "",
  gender: "Unisex",
  is_active: true,
  glb_file_url: "",
  scale: "1",
  position_x: "0",
  position_y: "0",
  position_z: "0",
  rotation_x: "0",
  rotation_y: "0",
  rotation_z: "0",
};

function toProductPayload(form: ProductFormState): AdminProductPayload {
  return {
    name: form.name,
    description: form.description,
    price: form.price,
    discount_price: form.discount_price ? form.discount_price : null,
    category: form.category ? Number(form.category) : null,
    collection: form.collection ? Number(form.collection) : null,
    frame_shape: form.frame_shape ? Number(form.frame_shape) : null,
    frame_material: form.frame_material ? Number(form.frame_material) : null,
    gender: form.gender,
    is_active: form.is_active,
  };
}

function toGlassesModelPayload(productId: number, form: ProductFormState): GlassesModelPayload {
  return {
    product: productId,
    glb_file_url: form.glb_file_url,
    scale: Number(form.scale || 1),
    position_x: Number(form.position_x || 0),
    position_y: Number(form.position_y || 0),
    position_z: Number(form.position_z || 0),
    rotation_x: Number(form.rotation_x || 0),
    rotation_y: Number(form.rotation_y || 0),
    rotation_z: Number(form.rotation_z || 0),
  };
}

export default function AdminProductsPage() {
  const globalSearch = useAdminUiStore((state) => state.globalSearch);

  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(defaultForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [imageProduct, setImageProduct] = useState<AdminProduct | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPrimaryImage, setIsPrimaryImage] = useState(false);

  const productsQuery = useQuery({
    queryKey: queryKeys.adminProducts(),
    queryFn: () => adminApi.products(),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.adminCategories,
    queryFn: adminApi.categories,
  });

  const collectionsQuery = useQuery({
    queryKey: queryKeys.adminCollections,
    queryFn: adminApi.collections,
  });

  const frameShapesQuery = useQuery({
    queryKey: queryKeys.adminFrameShapes,
    queryFn: adminApi.frameShapes,
  });

  const frameMaterialsQuery = useQuery({
    queryKey: queryKeys.adminFrameMaterials,
    queryFn: adminApi.frameMaterials,
  });

  const productImagesQuery = useQuery({
    queryKey: imageProduct ? queryKeys.adminProductImages(imageProduct.id) : ["admin-product-images-idle"],
    queryFn: () => adminApi.productImages(imageProduct!.id),
    enabled: Boolean(imageProduct),
  });

  const upsertProductMutation = useMutation({
    mutationFn: async () => {
      const payload = toProductPayload(formState);

      if (editingProduct) {
        const updatedProduct = await adminApi.updateProduct(editingProduct.id, payload);
        if (formState.glb_file_url) {
          const glassesPayload = toGlassesModelPayload(editingProduct.id, formState);
          if (editingProduct.glasses_model) {
            await adminApi.updateGlassesModel(editingProduct.glasses_model.id, glassesPayload);
          } else {
            await adminApi.createGlassesModel(glassesPayload);
          }
        }
        return updatedProduct;
      }

      const createdProduct = await adminApi.createProduct(payload);
      if (formState.glb_file_url) {
        await adminApi.createGlassesModel(toGlassesModelPayload(createdProduct.id, formState));
      }
      return createdProduct;
    },
    onSuccess: () => {
      toast.success(editingProduct ? "Product updated" : "Product created");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminGlassesModels() });
      setIsFormOpen(false);
      setEditingProduct(null);
      setFormState(defaultForm);
    },
    onError: () => toast.error("Unable to save product"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts() });
    },
    onError: () => toast.error("Unable to delete product"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => adminApi.toggleProduct(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts() });
    },
    onError: () => toast.error("Unable to update product status"),
  });

  const uploadImageMutation = useMutation({
    mutationFn: async () => {
      if (!imageProduct || !imageFile) return;
      return adminApi.createProductImage({
        product: imageProduct.id,
        image: imageFile,
        is_primary: isPrimaryImage,
      });
    },
    onSuccess: () => {
      toast.success("Image uploaded");
      if (imageProduct) {
        queryClient.invalidateQueries({ queryKey: queryKeys.adminProductImages(imageProduct.id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts() });
      setImageFile(null);
      setIsPrimaryImage(false);
    },
    onError: () => toast.error("Image upload failed"),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteProductImage(id),
    onSuccess: () => {
      toast.success("Image removed");
      if (imageProduct) {
        queryClient.invalidateQueries({ queryKey: queryKeys.adminProductImages(imageProduct.id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts() });
    },
    onError: () => toast.error("Unable to delete image"),
  });

  const categoryById = useMemo(() => {
    const map = new Map<number, string>();
    (categoriesQuery.data ?? []).forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categoriesQuery.data]);

  const filteredProducts = useMemo(() => {
    const list = productsQuery.data ?? [];
    return list.filter((product) => {
      const matchesGlobal = globalSearch
        ? `${product.name} ${product.description}`.toLowerCase().includes(globalSearch.toLowerCase())
        : true;
      const matchesCategory = categoryFilter ? String(product.category ?? "") === categoryFilter : true;
      const matchesGender = genderFilter ? product.gender === genderFilter : true;
      const matchesActive =
        activeFilter === "all"
          ? true
          : activeFilter === "active"
            ? product.is_active
            : !product.is_active;
      return matchesGlobal && matchesCategory && matchesGender && matchesActive;
    });
  }, [productsQuery.data, globalSearch, categoryFilter, genderFilter, activeFilter]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (productsQuery.isLoading) {
    return <AdminLoadingState label="Loading products..." />;
  }

  if (productsQuery.isError) {
    return <AdminErrorState description="Unable to load products." />;
  }

  const columns = [
    {
      key: "product",
      label: "Product",
      render: (row: AdminProduct) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="text-xs text-slate-400">#{row.id}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row: AdminProduct) => <span>{row.category ? categoryById.get(row.category) ?? row.category : "N/A"}</span>,
    },
    {
      key: "gender",
      label: "Gender",
      render: (row: AdminProduct) => <span>{row.gender}</span>,
    },
    {
      key: "price",
      label: "Price",
      render: (row: AdminProduct) => (
        <div>
          <p>${row.price}</p>
          <p className="text-xs text-slate-400">Discount: {row.discount_price ? `$${row.discount_price}` : "None"}</p>
        </div>
      ),
    },
    {
      key: "active",
      label: "Status",
      render: (row: AdminProduct) => <StatusBadge value={row.is_active ? "Active" : "Inactive"} />,
    },
    {
      key: "model",
      label: "3D Model",
      render: (row: AdminProduct) => <span className="text-xs">{row.glasses_model?.glb_file_url || "Not set"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: AdminProduct) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingProduct(row);
              setFormState({
                name: row.name,
                description: row.description,
                price: row.price,
                discount_price: row.discount_price || "",
                category: row.category ? String(row.category) : "",
                collection: row.collection ? String(row.collection) : "",
                frame_shape: row.frame_shape ? String(row.frame_shape) : "",
                frame_material: row.frame_material ? String(row.frame_material) : "",
                gender: row.gender,
                is_active: row.is_active,
                glb_file_url: row.glasses_model?.glb_file_url || "",
                scale: row.glasses_model ? String(row.glasses_model.scale) : "1",
                position_x: row.glasses_model ? String(row.glasses_model.position_x) : "0",
                position_y: row.glasses_model ? String(row.glasses_model.position_y) : "0",
                position_z: row.glasses_model ? String(row.glasses_model.position_z) : "0",
                rotation_x: row.glasses_model ? String(row.glasses_model.rotation_x) : "0",
                rotation_y: row.glasses_model ? String(row.glasses_model.rotation_y) : "0",
                rotation_z: row.glasses_model ? String(row.glasses_model.rotation_z) : "0",
              });
              setIsFormOpen(true);
            }}
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setImageProduct(row)}
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs"
          >
            Images
          </button>
          <button
            type="button"
            onClick={() =>
              toggleMutation.mutate({
                id: row.id,
                is_active: !row.is_active,
              })
            }
            className="rounded-lg border border-cyan-700/70 px-2 py-1 text-xs text-cyan-200"
          >
            {row.is_active ? "Deactivate" : "Activate"}
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
  ];

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Product Management"
        subtitle="Manage products, images, pricing, and 3D model mappings."
        action={
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setFormState(defaultForm);
              setIsFormOpen(true);
            }}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Add Product
          </button>
        }
      />

      <FilterBar>
        <select
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {(categoriesQuery.data ?? []).map((item) => (
            <option key={item.id} value={String(item.id)}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(event) => {
            setGenderFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">All Genders</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Unisex">Unisex</option>
        </select>

        <select
          value={activeFilter}
          onChange={(event) => {
            setActiveFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterBar>

      <DataTable columns={columns} rows={paginatedProducts} rowKey={(row) => row.id} emptyLabel="No products found." />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <p className="text-sm text-slate-400">
          Page {currentPage} / {pageCount}
        </p>
        <button
          type="button"
          disabled={currentPage >= pageCount}
          onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <AdminModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? "Edit Product" : "Create Product"}
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            upsertProductMutation.mutate();
          }}
        >
          <input
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Name"
            required
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Description"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2"
            rows={3}
          />
          <input
            value={formState.price}
            onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))}
            placeholder="Price"
            required
            type="number"
            step="0.01"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            value={formState.discount_price}
            onChange={(event) => setFormState((prev) => ({ ...prev, discount_price: event.target.value }))}
            placeholder="Discount price"
            type="number"
            step="0.01"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />

          <select
            value={formState.category}
            onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="">Category</option>
            {(categoriesQuery.data ?? []).map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={formState.collection}
            onChange={(event) => setFormState((prev) => ({ ...prev, collection: event.target.value }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="">Collection</option>
            {(collectionsQuery.data ?? []).map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={formState.frame_shape}
            onChange={(event) => setFormState((prev) => ({ ...prev, frame_shape: event.target.value }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="">Frame Shape</option>
            {(frameShapesQuery.data ?? []).map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={formState.frame_material}
            onChange={(event) => setFormState((prev) => ({ ...prev, frame_material: event.target.value }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="">Frame Material</option>
            {(frameMaterialsQuery.data ?? []).map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={formState.gender}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, gender: event.target.value as ProductFormState["gender"] }))
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Unisex">Unisex</option>
          </select>

          <label className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={formState.is_active}
              onChange={(event) => setFormState((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            Active
          </label>

          <input
            value={formState.glb_file_url}
            onChange={(event) => setFormState((prev) => ({ ...prev, glb_file_url: event.target.value }))}
            placeholder="GLB URL (/models/file.glb)"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2"
          />

          <input
            value={formState.scale}
            onChange={(event) => setFormState((prev) => ({ ...prev, scale: event.target.value }))}
            placeholder="Scale"
            type="number"
            step="0.001"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            value={formState.position_x}
            onChange={(event) => setFormState((prev) => ({ ...prev, position_x: event.target.value }))}
            placeholder="Position X"
            type="number"
            step="0.001"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            value={formState.position_y}
            onChange={(event) => setFormState((prev) => ({ ...prev, position_y: event.target.value }))}
            placeholder="Position Y"
            type="number"
            step="0.001"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            value={formState.position_z}
            onChange={(event) => setFormState((prev) => ({ ...prev, position_z: event.target.value }))}
            placeholder="Position Z"
            type="number"
            step="0.001"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            value={formState.rotation_x}
            onChange={(event) => setFormState((prev) => ({ ...prev, rotation_x: event.target.value }))}
            placeholder="Rotation X"
            type="number"
            step="0.001"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            value={formState.rotation_y}
            onChange={(event) => setFormState((prev) => ({ ...prev, rotation_y: event.target.value }))}
            placeholder="Rotation Y"
            type="number"
            step="0.001"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            value={formState.rotation_z}
            onChange={(event) => setFormState((prev) => ({ ...prev, rotation_z: event.target.value }))}
            placeholder="Rotation Z"
            type="number"
            step="0.001"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={upsertProductMutation.isPending}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 sm:col-span-2"
          >
            {upsertProductMutation.isPending ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
          </button>
        </form>
      </AdminModal>

      <AdminModal
        open={Boolean(imageProduct)}
        onClose={() => {
          setImageProduct(null);
          setImageFile(null);
          setIsPrimaryImage(false);
        }}
        title={`Manage Images${imageProduct ? ` - ${imageProduct.name}` : ""}`}
      >
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={isPrimaryImage}
                onChange={(event) => setIsPrimaryImage(event.target.checked)}
              />
              Primary
            </label>
          </div>
          <button
            type="button"
            disabled={!imageFile || uploadImageMutation.isPending}
            onClick={() => uploadImageMutation.mutate()}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            Upload Image
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            {productImagesQuery.data?.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-800 p-3">
                <img src={imageUrl(item.image)} alt="Product" className="h-36 w-full rounded-lg object-cover" />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-400">{item.is_primary ? "Primary" : "Secondary"}</p>
                  <button
                    type="button"
                    onClick={() => deleteImageMutation.mutate(item.id)}
                    className="rounded-lg border border-rose-700/70 px-2 py-1 text-xs text-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {(productImagesQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-400">No images uploaded.</p>
            ) : null}
          </div>
        </div>
      </AdminModal>
    </div>
  );
}