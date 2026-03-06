import mongoose, { Schema, Document, Model } from "mongoose"

export interface ProductDocument extends Document {
  name: string; description: string; price: number
  category: string; tag?: string; sizes: string[]
  image: string; stockStatus: "active" | "sold_out" | "coming_soon"
  active: boolean; couponCode?: string; couponDiscount?: number
}

const ProductSchema = new Schema<ProductDocument>({
  name:        { type: String, required: true },
  description: { type: String, default: "" },
  price:       { type: Number, required: true },
  category:    { type: String, required: true },
  tag:         { type: String, default: "" },
  sizes:       { type: [String], default: [] },
  image:       { type: String, default: "" },
  stockStatus: { type: String, enum: ["active","sold_out","coming_soon"], default: "active" },
  active:      { type: Boolean, default: true },
  couponCode:  { type: String, default: "" },
  couponDiscount: { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true } })

ProductSchema.index({ category: 1 })
ProductSchema.index({ stockStatus: 1 })

const Product: Model<ProductDocument> = mongoose.models.Product || mongoose.model("Product", ProductSchema)
export default Product
