export type UserRole = "admin" | "customer";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  image: string | null;
  is_active: boolean;
}

export interface FrameShape {
  id: number;
  name: string;
}

export interface FrameMaterial {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  product?: number;
  image: string;
  is_primary: boolean;
}

export interface GlassesModel {
  id: number;
  product: number;
  glb_file_url: string;
  scale: number;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  calibration_status: "pending" | "success" | "failed";
  calibration_source: "manual" | "fallback";
  calibration_error: string;
  last_calibrated_at: string | null;
  created_at: string;
}

export interface Product {
  id: number;
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
  created_at: string;
  images: ProductImage[];
  glasses_model: GlassesModel | null;
}

export interface ProductFilterParams {
  category?: number;
  frame_shape?: number;
  collection?: number;
  gender?: string;
  min_price?: number;
  max_price?: number;
}

export interface CartItem {
  id: number;
  product: number;
  product_name: string;
  unit_price: string;
  quantity: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
}

export interface WishlistItem {
  id: number;
  product: number;
  product_name: string;
  price: string;
  discount_price: string | null;
  created_at: string;
}

export interface Wishlist {
  id: number;
  items: WishlistItem[];
}

export interface Review {
  id: number;
  product: number;
  user: number;
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ShippingAddressPayload {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderCreatePayload {
  payment_method: string;
  shipping_address: ShippingAddressPayload;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  price_at_purchase: string;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Payment {
  order_id?: number;
  user_id?: number;
  amount: string;
  status: "Pending" | "Paid" | "Failed";
  payment_method: string;
  transaction_id: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  user: number;
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  total_amount: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  payment: Payment;
}

export interface Notification {
  id: number;
  user?: number;
  user_email?: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
