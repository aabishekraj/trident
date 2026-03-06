import mongoose, { Schema, Document, Model } from "mongoose";
import { IOrder, OrderStatus } from "@/types";

export interface OrderDocument extends Omit<IOrder, "_id">, Document {}

// Generates unique order IDs like TRD-20260306-A7K2X9
function generateOrderId(): string {
  const date = new Date()
  const d = date.toISOString().slice(0, 10).replace(/-/g, "")
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `TRD-${d}-${rand}`
}

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    qty:       { type: Number, required: true, min: 1 },
    size:      { type: String, default: "" },
  },
  { _id: false }
);

const CustomerSchema = new Schema(
  {
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    phone:   { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { _id: false }
);

const OrderSchema = new Schema<OrderDocument>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      default: generateOrderId,
    },
    paymentMethod: { type: String, default: "card" },
    paymentStatus: { type: String, enum: ["pending","paid","failed","refunded"], default: "pending" },
    stripeSessionId: { type: String, default: "" },
    trackingNumber:  { type: String, default: "" },
    customer:    { type: CustomerSchema, required: true },
    items:       { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"] as OrderStatus[],
      default: "pending",
    },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt automatically
    toJSON: { virtuals: true },
  }
);

// Index for fast queries
OrderSchema.index({ "customer.email": 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<OrderDocument> =
  mongoose.models.Order || mongoose.model<OrderDocument>("Order", OrderSchema);

export default Order;
