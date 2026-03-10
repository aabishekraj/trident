import mongoose, { Schema, Document, Model } from "mongoose"

export interface WishlistDocument extends Document {
  customerEmail: string
  productIds:    string[]
}

const WishlistSchema = new Schema<WishlistDocument>({
  customerEmail: { type: String, required: true, unique: true, lowercase: true },
  productIds:    { type: [String], default: [] },
}, { timestamps: true })

const Wishlist: Model<WishlistDocument> = mongoose.models.Wishlist || mongoose.model("Wishlist", WishlistSchema)
export default Wishlist
