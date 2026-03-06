// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IOrder {
  _id?: string;
  orderId: string;          // e.g. "TRD-1001"
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface IProduct {
  _id?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  tag?: string;
  active: boolean;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface IAnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  pendingOrders: number;
  revenueByDay: { label: string; value: number }[];
  revenueByMonth: { label: string; value: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; units: number }[];
}

// ─── API Response Helpers ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
