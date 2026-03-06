import mongoose, { Schema, Document, Model } from "mongoose"

export interface CouponDocument extends Document {
  code: string; discount: number; type: "percent" | "fixed"
  scope: "all" | "category" | "products"
  categories?: string[]; productIds?: string[]
  minOrderValue: number; maxUses: number; usedCount: number
  expiresAt?: Date; active: boolean; description?: string
}

const CouponSchema = new Schema<CouponDocument>({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount:      { type: Number, required: true, min: 0 },
  type:          { type: String, enum: ["percent","fixed"], default: "percent" },
  scope:         { type: String, enum: ["all","category","products"], default: "all" },
  categories:    { type: [String], default: [] },
  productIds:    { type: [String], default: [] },
  minOrderValue: { type: Number, default: 0 },
  maxUses:       { type: Number, default: 100 },
  usedCount:     { type: Number, default: 0 },
  expiresAt:     { type: Date },
  active:        { type: Boolean, default: true },
  description:   { type: String, default: "" },
}, { timestamps: true })

CouponSchema.index({ code: 1 })
CouponSchema.index({ active: 1, expiresAt: 1 })

const Coupon: Model<CouponDocument> = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema)
export default Coupon
