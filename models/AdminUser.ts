import mongoose, { Schema, Document, Model } from "mongoose"
import crypto from "crypto"

// Re-export from the client-safe module so existing server imports keep working
export type { AdminRole } from "@/lib/roles"
export { ROLE_PERMISSIONS } from "@/lib/roles"
import type { AdminRole } from "@/lib/roles"

export interface AdminUserDocument extends Document {
  username:  string
  email:     string
  password:  string
  role:      AdminRole
  active:    boolean
  lastLogin: Date | null
  createdBy: string
  checkPassword(plain: string): boolean
}

const AdminUserSchema = new Schema<AdminUserDocument>({
  username:  { type: String, required: true, unique: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ["superadmin","manager","order_manager","analyst"], default: "analyst" },
  active:    { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  createdBy: { type: String, default: "system" },
}, { timestamps: true })

AdminUserSchema.methods.checkPassword = function(plain: string): boolean {
  const hash = crypto.createHash("sha256").update(plain + (process.env.ADMIN_SALT || "trident_salt")).digest("hex")
  return hash === this.password
}

export function hashPassword(plain: string): string {
  return crypto.createHash("sha256").update(plain + (process.env.ADMIN_SALT || "trident_salt")).digest("hex")
}

const AdminUser: Model<AdminUserDocument> =
  mongoose.models.AdminUser || mongoose.model<AdminUserDocument>("AdminUser", AdminUserSchema)

export default AdminUser
