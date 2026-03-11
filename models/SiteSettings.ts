import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISiteSettings extends Document {
  promoBannerMessages: string[]
  updatedAt: Date
}

const SiteSettingsSchema = new Schema<ISiteSettings>({
  promoBannerMessages: {
    type: [String],
    default: [
      "🚚 FREE SHIPPING ON ORDERS OVER $500",
      "⚡ LIMITED DROPS — SHOP BEFORE THEY'RE GONE",
      "↩  30-DAY HASSLE-FREE RETURNS",
      "🔥 USE CODE TRIDENT10 FOR 10% OFF YOUR FIRST ORDER",
    ],
  },
  updatedAt: { type: Date, default: () => new Date() },
}, { timestamps: false })

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema)

export default SiteSettings
