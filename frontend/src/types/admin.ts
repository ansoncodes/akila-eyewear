import type { Category, Collection, FrameMaterial, FrameShape, GlassesModel, Notification, Order, Payment, Product, Review, User } from "@/types/api";

export interface ApiListEnvelope<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ApiListResponse<T> = T[] | ApiListEnvelope<T>;

export interface AdminProductFilters {
  q?: string;
  category?: number;
  collection?: number;
  frame_shape?: number;
  frame_material?: number;
  gender?: "Men" | "Women" | "Unisex";
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface AdminProductPayload {
  name: string;
  description: string;
  price: string;
  discount_price: string | null;
  category: number | null;
  collection: number | null;
  frame_shape: number | null;
  frame_material: number | null;
  gender: "Men" | "Women" | "Unisex";
  is_active: boolean;
}

export interface AdminCollectionPayload {
  name: string;
  description: string;
  is_active: boolean;
  image?: File | null;
}

export interface NamedEntityPayload {
  name: string;
}

export interface ProductImagePayload {
  product: number;
  image: File;
  is_primary: boolean;
}

export interface GlassesModelPayload {
  product: number;
  glb_file_url: string;
  scale: number;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
}

export interface GlassesBulkCalibrationPayload {
  ids: number[];
}

export interface AdminOrderFilters {
  status?: string;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
}

export interface AdminReviewFilters {
  product?: number;
  rating?: number;
  date_from?: string;
  date_to?: string;
}

export interface AdminCustomerListItem extends User {
  date_joined: string;
  order_count: number;
  total_spend: string | null;
  review_count: number;
}

export interface AdminCustomerOrderSummary {
  id: number;
  status: string;
  total_amount: string;
  created_at: string;
}

export interface AdminCustomerReviewSummary {
  id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AdminCustomerDetail extends User {
  date_joined: string;
  last_login: string | null;
  order_count: number;
  total_spend: string;
  review_count: number;
  orders: AdminCustomerOrderSummary[];
  reviews: AdminCustomerReviewSummary[];
}

export interface AdminDashboardData {
  orders: Order[];
  payments: Payment[];
  customers: AdminCustomerListItem[];
  products: Product[];
  reviews: Review[];
}

export interface AdminNotificationPayload {
  user?: number;
  title: string;
  message: string;
  broadcast_customers?: boolean;
}

export type AdminCategory = Category;
export type AdminCollection = Collection;
export type AdminFrameShape = FrameShape;
export type AdminFrameMaterial = FrameMaterial;
export type AdminProduct = Product;
export type AdminGlassesModel = GlassesModel;
export type AdminOrder = Order;
export type AdminPayment = Payment;
export type AdminReview = Review;
export type AdminNotification = Notification;