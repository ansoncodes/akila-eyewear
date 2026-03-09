"use client";

import api from "@/lib/api/client";
import type {
  AdminCollection,
  AdminCollectionPayload,
  AdminCustomerDetail,
  AdminCustomerListItem,
  AdminDashboardData,
  AdminGlassesModel,
  AdminNotification,
  AdminNotificationPayload,
  AdminOrder,
  AdminOrderFilters,
  AdminPayment,
  AdminProduct,
  AdminProductFilters,
  AdminProductPayload,
  AdminReview,
  AdminReviewFilters,
  ApiListResponse,
  GlassesBulkCalibrationPayload,
  GlassesModelPayload,
  NamedEntityPayload,
  ProductImagePayload,
} from "@/types/admin";
import type { Category, FrameMaterial, FrameShape, ProductImage } from "@/types/api";

function normalizeList<T>(data: ApiListResponse<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results;
}

function toCollectionFormData(payload: AdminCollectionPayload) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("is_active", payload.is_active ? "true" : "false");
  if (payload.image) {
    formData.append("image", payload.image);
  }
  return formData;
}

function toProductImageFormData(payload: ProductImagePayload) {
  const formData = new FormData();
  formData.append("product", String(payload.product));
  formData.append("image", payload.image);
  formData.append("is_primary", payload.is_primary ? "true" : "false");
  return formData;
}

export const adminApi = {
  dashboard: async (): Promise<AdminDashboardData> => {
    const [orders, payments, customers, products, reviews] = await Promise.all([
      adminApi.orders(),
      adminApi.payments(),
      adminApi.customers(),
      adminApi.products(),
      adminApi.reviews(),
    ]);

    return {
      orders,
      payments,
      customers,
      products,
      reviews,
    };
  },

  products: async (params?: AdminProductFilters) => {
    const { data } = await api.get<ApiListResponse<AdminProduct>>("/products/", { params });
    return normalizeList(data);
  },
  productDetail: async (id: number | string) => {
    const { data } = await api.get<AdminProduct>(`/products/${id}/`);
    return data;
  },
  createProduct: async (payload: AdminProductPayload) => {
    const { data } = await api.post<AdminProduct>("/products/", payload);
    return data;
  },
  updateProduct: async (id: number, payload: Partial<AdminProductPayload>) => {
    const { data } = await api.patch<AdminProduct>(`/products/${id}/`, payload);
    return data;
  },
  deleteProduct: async (id: number) => {
    await api.delete(`/products/${id}/`);
  },
  toggleProduct: async (id: number, is_active: boolean) => {
    const { data } = await api.patch<AdminProduct>(`/products/${id}/`, { is_active });
    return data;
  },

  productImages: async (productId: number) => {
    const { data } = await api.get<ApiListResponse<ProductImage>>("/product-images/", {
      params: { product: productId },
    });
    return normalizeList(data);
  },
  createProductImage: async (payload: ProductImagePayload) => {
    const { data } = await api.post<ProductImage>("/product-images/", toProductImageFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  deleteProductImage: async (id: number) => {
    await api.delete(`/product-images/${id}/`);
  },

  glassesModels: async () => {
    const { data } = await api.get<ApiListResponse<AdminGlassesModel>>("/glasses-models/");
    return normalizeList(data);
  },
  createGlassesModel: async (payload: GlassesModelPayload) => {
    const { data } = await api.post<AdminGlassesModel>("/glasses-models/", payload);
    return data;
  },
  updateGlassesModel: async (id: number, payload: Partial<GlassesModelPayload>) => {
    const { data } = await api.patch<AdminGlassesModel>(`/glasses-models/${id}/`, payload);
    return data;
  },
  deleteGlassesModel: async (id: number) => {
    await api.delete(`/glasses-models/${id}/`);
  },
  runCalibration: async (id: number) => {
    const { data } = await api.post<AdminGlassesModel>(`/glasses-models/${id}/run-calibration/`);
    return data;
  },
  runCalibrationBulk: async (payload: GlassesBulkCalibrationPayload) => {
    const { data } = await api.post<AdminGlassesModel[]>("/glasses-models/run-calibration-bulk/", payload);
    return data;
  },

  categories: async () => {
    const { data } = await api.get<ApiListResponse<Category>>("/categories/");
    return normalizeList(data);
  },
  createCategory: async (payload: NamedEntityPayload) => {
    const { data } = await api.post<Category>("/categories/", payload);
    return data;
  },
  updateCategory: async (id: number, payload: NamedEntityPayload) => {
    const { data } = await api.patch<Category>(`/categories/${id}/`, payload);
    return data;
  },
  deleteCategory: async (id: number) => {
    await api.delete(`/categories/${id}/`);
  },

  collections: async () => {
    const { data } = await api.get<ApiListResponse<AdminCollection>>("/collections/");
    return normalizeList(data);
  },
  createCollection: async (payload: AdminCollectionPayload) => {
    const { data } = await api.post<AdminCollection>("/collections/", toCollectionFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  updateCollection: async (id: number, payload: AdminCollectionPayload) => {
    const { data } = await api.patch<AdminCollection>(`/collections/${id}/`, toCollectionFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  deleteCollection: async (id: number) => {
    await api.delete(`/collections/${id}/`);
  },

  frameShapes: async () => {
    const { data } = await api.get<ApiListResponse<FrameShape>>("/frame-shapes/");
    return normalizeList(data);
  },
  createFrameShape: async (payload: NamedEntityPayload) => {
    const { data } = await api.post<FrameShape>("/frame-shapes/", payload);
    return data;
  },
  updateFrameShape: async (id: number, payload: NamedEntityPayload) => {
    const { data } = await api.patch<FrameShape>(`/frame-shapes/${id}/`, payload);
    return data;
  },
  deleteFrameShape: async (id: number) => {
    await api.delete(`/frame-shapes/${id}/`);
  },

  frameMaterials: async () => {
    const { data } = await api.get<ApiListResponse<FrameMaterial>>("/frame-materials/");
    return normalizeList(data);
  },
  createFrameMaterial: async (payload: NamedEntityPayload) => {
    const { data } = await api.post<FrameMaterial>("/frame-materials/", payload);
    return data;
  },
  updateFrameMaterial: async (id: number, payload: NamedEntityPayload) => {
    const { data } = await api.patch<FrameMaterial>(`/frame-materials/${id}/`, payload);
    return data;
  },
  deleteFrameMaterial: async (id: number) => {
    await api.delete(`/frame-materials/${id}/`);
  },

  orders: async (params?: AdminOrderFilters) => {
    const { data } = await api.get<ApiListResponse<AdminOrder>>("/orders/", { params });
    return normalizeList(data);
  },
  orderDetail: async (id: string | number) => {
    const { data } = await api.get<AdminOrder>(`/orders/${id}/`);
    return data;
  },
  updateOrderStatus: async (id: number, status: AdminOrder["status"]) => {
    const { data } = await api.patch<AdminOrder>(`/orders/${id}/status/`, { status });
    return data;
  },

  payments: async () => {
    const { data } = await api.get<ApiListResponse<AdminPayment>>("/payments/");
    return normalizeList(data);
  },
  paymentDetail: async (orderId: number | string) => {
    const { data } = await api.get<AdminPayment>(`/payments/${orderId}/`);
    return data;
  },

  customers: async (params?: { q?: string }) => {
    const { data } = await api.get<ApiListResponse<AdminCustomerListItem>>("/admin/customers/", { params });
    return normalizeList(data);
  },
  customerDetail: async (id: number | string) => {
    const { data } = await api.get<AdminCustomerDetail>(`/admin/customers/${id}/`);
    return data;
  },

  reviews: async (params?: AdminReviewFilters) => {
    const { data } = await api.get<ApiListResponse<AdminReview>>("/reviews/", { params });
    return normalizeList(data);
  },
  deleteReview: async (id: number) => {
    await api.delete(`/reviews/${id}/`);
  },

  notifications: async () => {
    const { data } = await api.get<ApiListResponse<AdminNotification>>("/notifications/");
    return normalizeList(data);
  },
  createNotification: async (payload: AdminNotificationPayload) => {
    const { data } = await api.post<AdminNotification | { detail: string }>("/notifications/", payload);
    return data;
  },
  markNotificationRead: async (id: number) => {
    const { data } = await api.post<AdminNotification>(`/notifications/${id}/read/`);
    return data;
  },
  markNotificationReadAll: async () => {
    const { data } = await api.post<{ detail: string }>("/notifications/read-all/");
    return data;
  },
  deleteNotification: async (id: number) => {
    await api.delete(`/notifications/${id}/`);
  },
};