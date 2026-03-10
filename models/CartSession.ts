import mongoose, { Schema, Document, Model } from "mongoose"

export interface CartSessionDocument extends Document {
  customerEmail: string
  customerName:  string
  items:         Array<{ _id: string; name: string; price: number; qty: number; image?: string; selectedSize?: string }>
  total:         number
  reminderSent:  boolean
  checkedOutAt?: Date
}

const CartSessionSchema = new Schema<CartSessionDocument>({
  customerEmail: { type: String, required: true, lowercase: true },
  customerName:  { type: String, default: "" },
  items:         { type: Schema.Types.Mixed, default: [] },
  total:         { type: Number, default: 0 },
  reminderSent:  { type: Boolean, default: false },
  checkedOutAt:  { type: Date },
}, { timestamps: true })

CartSessionSchema.index({ customerEmail: 1 })
CartSessionSchema.index({ reminderSent: 1, createdAt: 1 })
// Auto-expire after 7 days
CartSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 })

const CartSession: Model<CartSessionDocument> = mongoose.models.CartSession || mongoose.model("CartSession", CartSessionSchema)
export default CartSession
