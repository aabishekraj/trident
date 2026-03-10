import mongoose, { Schema, Document, Model } from "mongoose"
import bcrypt from "bcryptjs"

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
  checkPassword(plain: string): Promise<boolean>
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

AdminUserSchema.methods.checkPassword = async function(plain: string): Promise<boolean> {
  // Support legacy SHA-256 hashes (60 chars) and new bcrypt hashes ($2b$...)
  if (this.password.startsWith("$2b$") || this.password.startsWith("$2a$")) {
    return bcrypt.compare(plain, this.password)
  }
  // Legacy SHA-256 path — verify then migrate on-the-fly
  const crypto = await import("crypto")
  const legacyHash = crypto.createHash("sha256").update(plain + (process.env.ADMIN_SALT || "trident_salt")).digest("hex")
  if (legacyHash === this.password) {
    // Migrate to bcrypt
    this.password = await bcrypt.hash(plain, 12)
    await this.save()
    return true
  }
  return false
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

const AdminUser: Model<AdminUserDocument> =
  mongoose.models.AdminUser || mongoose.model<AdminUserDocument>("AdminUser", AdminUserSchema)

export default AdminUser
