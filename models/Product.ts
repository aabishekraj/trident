import mongoose, { Schema, Document, Model } from "mongoose"

export interface ProductDocument extends Document {
  name: string; description: string; price: number
  category: string; tag?: string; sizes: string[]; colors: string[]
  image: string; images: string[]
  stockStatus: "active" | "sold_out" | "coming_soon"
  stockQuantity: number
  active: boolean; featured: boolean
  couponCode?: string; couponDiscount?: number
  avgRating: number; reviewCount: number
}

const ProductSchema = new Schema<ProductDocument>({
  name:          { type: String, required: true },
  description:   { type: String, default: "" },
  price:         { type: Number, required: true },
  category:      { type: String, required: true },
  tag:           { type: String, default: "" },
  sizes:         { type: [String], default: [] },
  colors:        { type: [String], default: [] },
  image:         { type: String, default: "" },
  images:        { type: [String], default: [] },
  stockStatus:   { type: String, enum: ["active","sold_out","coming_soon"], default: "active" },
  stockQuantity: { type: Number, default: 0 },
  active:        { type: Boolean, default: true },
  featured:      { type: Boolean, default: false },
  couponCode:    { type: String, default: "" },
  couponDiscount:{ type: Number, default: 0 },
  avgRating:     { type: Number, default: 0 },
  reviewCount:   { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true } })

ProductSchema.index({ category: 1 })
ProductSchema.index({ stockStatus: 1 })
ProductSchema.index({ featured: 1 })
ProductSchema.index({ tag: 1 })
ProductSchema.index({ name: "text", description: "text" })

const Product: Model<ProductDocument> = mongoose.models.Product || mongoose.model("Product", ProductSchema)
export default Product
