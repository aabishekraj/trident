import mongoose, { Schema, Document, Model } from "mongoose"
import crypto from "crypto"

export type AdminRole = "superadmin" | "manager" | "order_manager" | "analyst"

// Role permissions matrix
export const ROLE_PERMISSIONS: Record<AdminRole, {
  dashboard: boolean
  orders:    { view: boolean; edit: boolean; delete: boolean }
  products:  { view: boolean; create: boolean; edit: boolean; delete: boolean; bulkImport: boolean }
  coupons:   { view: boolean; create: boolean; edit: boolean; delete: boolean }
  analytics: boolean
  users:     { view: boolean; create: boolean; edit: boolean; delete: boolean }
}> = {
  superadmin: {
    dashboard: true,
    orders:    { view: true,  edit: true,  delete: true  },
    products:  { view: true,  create: true,  edit: true,  delete: true,  bulkImport: true  },
    coupons:   { view: true,  create: true,  edit: true,  delete: true  },
    analytics: true,
    users:     { view: true,  create: true,  edit: true,  delete: true  },
  },
  manager: {
    dashboard: true,
    orders:    { view: true,  edit: true,  delete: false },
    products:  { view: true,  create: true,  edit: true,  delete: false, bulkImport: true  },
    coupons:   { view: true,  create: true,  edit: true,  delete: false },
    analytics: true,
    users:     { view: true,  create: false, edit: false, delete: false },
  },
  order_manager: {
    dashboard: true,
    orders:    { view: true,  edit: true,  delete: false },
    products:  { view: true,  create: false, edit: false, delete: false, bulkImport: false },
    coupons:   { view: true,  create: false, edit: false, delete: false },
    analytics: false,
    users:     { view: false, create: false, edit: false, delete: false },
  },
  analyst: {
    dashboard: true,
    orders:    { view: true,  edit: false, delete: false },
    products:  { view: true,  create: false, edit: false, delete: false, bulkImport: false },
    coupons:   { view: true,  create: false, edit: false, delete: false },
    analytics: true,
    users:     { view: false, create: false, edit: false, delete: false },
  },
}

export interface AdminUserDocument extends Document {
  username:  string
  email:     string
  password:  string   // bcrypt hash
  role:      AdminRole
  active:    boolean
  lastLogin: Date | null
  createdBy: string
  checkPassword(plain: string): boolean
}

const AdminUserSchema = new Schema<AdminUserDocument>({
  username:  { type: String, required: true, unique: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Simple SHA-256 hash (no bcrypt dependency needed)
  password:  { type: String, required: true },
  role:      { type: String, enum: ["superadmin","manager","order_manager","analyst"], default: "analyst" },
  active:    { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  createdBy: { type: String, default: "system" },
}, { timestamps: true })

// Simple hash helper (avoids bcrypt dependency — swap for bcrypt in production)
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
