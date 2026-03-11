import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import AdminUser, { hashPassword } from "@/models/AdminUser"
import { checkPermission } from "@/lib/adminAuth"

const VALID_ROLES = ["superadmin", "manager", "order_manager", "analyst"]
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET /api/admin/users — list all admin users
export async function GET(req: NextRequest) {
  const err = checkPermission(req, "users", "view")
  if (err) return NextResponse.json({ success: false, error: err.error }, { status: err.status })
  try {
    await connectDB()
    const users = await AdminUser.find({}).select("-password").sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data: users })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}

// POST /api/admin/users — create admin user
export async function POST(req: NextRequest) {
  const err = checkPermission(req, "users", "create")
  if (err) return NextResponse.json({ success: false, error: err.error }, { status: err.status })
  try {
    await connectDB()
    const { username, email, password, role } = await req.json()

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, error: "username, email, password required" }, { status: 400 })
    }
    if (!EMAIL_RE.test(String(email))) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    const assignedRole = VALID_ROLES.includes(role) ? role : "analyst"
    const existing = await AdminUser.findOne({
      $or: [{ username: String(username) }, { email: String(email).toLowerCase() }]
    })
    if (existing) {
      return NextResponse.json({ success: false, error: "Username or email already exists" }, { status: 409 })
    }

    const user = await AdminUser.create({
      username: String(username).slice(0, 60),
      email:    String(email).toLowerCase().slice(0, 100),
      password: await hashPassword(String(password)),
      role:     assignedRole,
    })

    const { password: _, ...safe } = user.toObject()
    return NextResponse.json({ success: true, data: safe }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
}
