import mongoose, { Schema, Document, Model } from "mongoose"

export type Currency = "USD" | "INR" | "EUR"

export interface IShippingCountryRate {
  country: string
  rate: number
}

export interface ISiteSettings extends Document {
  promoBannerMessages: string[]
  currency: Currency
  shippingFreeThreshold: number
  shippingFlatRate: number
  shippingCountryRates: IShippingCountryRate[]
  taxRate: number
  updatedAt: Date
}

const ShippingCountryRateSchema = new Schema<IShippingCountryRate>(
  { country: { type: String, required: true }, rate: { type: Number, required: true } },
  { _id: false }
)

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
  currency: { type: String, enum: ["USD", "INR", "EUR"], default: "USD" },
  shippingFreeThreshold: { type: Number, default: 500 },
  shippingFlatRate:      { type: Number, default: 49 },
  shippingCountryRates:  { type: [ShippingCountryRateSchema], default: [] },
  taxRate:               { type: Number, default: 18 },
  updatedAt: { type: Date, default: () => new Date() },
}, { timestamps: false })

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema)

export default SiteSettings
