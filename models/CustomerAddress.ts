import mongoose, { Schema, Document, Model } from "mongoose"

export interface CustomerAddressDocument extends Document {
  customerEmail: string
  label:         string   // "Home", "Work", etc.
  name:          string
  phone:         string
  address:       string
  city:          string
  state:         string
  zip:           string
  country:       string
  isDefault:     boolean
}

const CustomerAddressSchema = new Schema<CustomerAddressDocument>({
  customerEmail: { type: String, required: true, lowercase: true },
  label:         { type: String, default: "Home" },
  name:          { type: String, required: true },
  phone:         { type: String, default: "" },
  address:       { type: String, required: true },
  city:          { type: String, required: true },
  state:         { type: String, required: true },
  zip:           { type: String, required: true },
  country:       { type: String, default: "India" },
  isDefault:     { type: Boolean, default: false },
}, { timestamps: true })

CustomerAddressSchema.index({ customerEmail: 1 })

const CustomerAddress: Model<CustomerAddressDocument> = mongoose.models.CustomerAddress || mongoose.model("CustomerAddress", CustomerAddressSchema)
export default CustomerAddress
