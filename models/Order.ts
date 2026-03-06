import mongoose, { Schema, Document, Model } from "mongoose";
import { IOrder, OrderStatus } from "@/types";

export interface OrderDocument extends Omit<IOrder, "_id">, Document {}

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    qty:       { type: Number, required: true, min: 1 },
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
      default: () => `TRD-${Date.now().toString().slice(-6)}`,
    },
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
