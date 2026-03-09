"use client";

import api from "@/lib/api/client";
import type {
  Category,
  Collection,
  FrameMaterial,
  FrameShape,
  LoginPayload,
  LoginResponse,
  Notification,
  Order,
  OrderCreatePayload,
  Product,
  ProductFilterParams,
  RegisterPayload,
  Review,
  User,
  UserProfilePayload,
  Wishlist,
  Cart,
} from "@/types/api";

export const authApi = {
  register: async (payload: RegisterPayload) => {
    const { data } = await api.post<User>("/auth/register/", payload);
    return data;
  },
  login: async (payload: LoginPayload) => {
    const { data } = await api.post<LoginResponse>("/auth/login/", payload);
    return data;
  },
  logout: async (refreshToken: string) => {
    await api.post("/auth/logout/", { refresh: refreshToken });
  },
  me: async () => {
    const { data } = await api.get<User>("/auth/me/");
    return data;
  },
  updateProfile: async (payload: UserProfilePayload) => {
    const { data } = await api.patch<User>("/auth/me/", payload);
    return data;
  },
  changePassword: async (payload: { current_password: string; new_password: string; retype_password: string }) => {
    const { data } = await api.post<{ detail: string }>("/auth/change-password/", payload);
    return data;
  },
  deleteProfile: async () => {
    await api.delete("/auth/me/");
  },
};

export const productsApi = {
  list: async (params?: ProductFilterParams) => {
    const { data } = await api.get<Product[]>("/products/", { params });
    return data;
  },
  detail: async (id: string | number) => {
    const { data } = await api.get<Product>(`/products/${id}/`);
    return data;
  },
  categories: async () => {
    const { data } = await api.get<Category[]>("/categories/");
    return data;
  },
  collections: async () => {
    const { data } = await api.get<Collection[]>("/collections/");
    return data;
  },
  frameShapes: async () => {
    const { data } = await api.get<FrameShape[]>("/frame-shapes/");
    return data;
  },
  frameMaterials: async () => {
    const { data } = await api.get<FrameMaterial[]>("/frame-materials/");
    return data;
  },
};

export const cartApi = {
  get: async () => {
    const { data } = await api.get<Cart>("/cart/");
    return data;
  },
  add: async (productId: number, quantity = 1) => {
    const { data } = await api.post<Cart>("/cart/add/", {
      product_id: productId,
      quantity,
    });
    return data;
  },
  update: async (itemId: number, quantity: number) => {
    const { data } = await api.patch<Cart>(`/cart/update/${itemId}/`, { quantity });
    return data;
  },
  remove: async (itemId: number) => {
    const { data } = await api.delete<Cart>(`/cart/remove/${itemId}/`);
    return data;
  },
};

export const wishlistApi = {
  get: async () => {
    const { data } = await api.get<Wishlist>("/wishlist/");
    return data;
  },
  add: async (productId: number) => {
    const { data } = await api.post<Wishlist>("/wishlist/add/", { product_id: productId });
    return data;
  },
  remove: async (itemId: number) => {
    const { data } = await api.delete<Wishlist>(`/wishlist/remove/${itemId}/`);
    return data;
  },
};

export const orderApi = {
  list: async () => {
    const { data } = await api.get<Order[]>("/orders/");
    return data;
  },
  detail: async (id: string | number) => {
    const { data } = await api.get<Order>(`/orders/${id}/`);
    return data;
  },
  create: async (payload: OrderCreatePayload) => {
    const { data } = await api.post<Order>("/orders/", payload);
    return data;
  },
  pay: async (orderId: number) => {
    const { data } = await api.post(`/payments/pay/${orderId}/`);
    return data;
  },
  cancel: async (orderId: number) => {
    const { data } = await api.post<Order>(`/orders/${orderId}/cancel/`);
    return data;
  },
  payment: async (orderId: number) => {
    const { data } = await api.get(`/payments/${orderId}/`);
    return data;
  },
};

export const reviewApi = {
  list: async (productId: number) => {
    const { data } = await api.get<Review[]>("/reviews/", {
      params: { product: productId },
    });
    return data;
  },
  create: async (payload: { product: number; rating: number; comment: string }) => {
    const { data } = await api.post<Review>("/reviews/", payload);
    return data;
  },
  remove: async (reviewId: number) => {
    await api.delete(`/reviews/${reviewId}/`);
  },
};

export const notificationApi = {
  list: async () => {
    const { data } = await api.get<Notification[]>("/notifications/");
    return data;
  },
  read: async (id: number) => {
    const { data } = await api.post<Notification>(`/notifications/${id}/read/`);
    return data;
  },
  readAll: async () => {
    const { data } = await api.post<{ detail: string }>("/notifications/read-all/");
    return data;
  },
};
