import mongoose, { Schema, Document, Model } from "mongoose"

export interface ReviewDocument extends Document {
  productId:     string
  orderId:       string
  customerEmail: string
  customerName:  string
  rating:        number   // 1-5
  title:         string
  body:          string
  verified:      boolean  // true if customer actually bought the product
}

const ReviewSchema = new Schema<ReviewDocument>({
  productId:     { type: String, required: true },
  orderId:       { type: String, default: "" },
  customerEmail: { type: String, required: true, lowercase: true },
  customerName:  { type: String, required: true },
  rating:        { type: Number, required: true, min: 1, max: 5 },
  title:         { type: String, default: "" },
  body:          { type: String, required: true },
  verified:      { type: Boolean, default: false },
}, { timestamps: true })

ReviewSchema.index({ productId: 1, createdAt: -1 })
ReviewSchema.index({ customerEmail: 1 })
ReviewSchema.index({ productId: 1, customerEmail: 1 }, { unique: true })

const Review: Model<ReviewDocument> = mongoose.models.Review || mongoose.model("Review", ReviewSchema)
export default Review
