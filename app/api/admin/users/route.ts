import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import AdminUser, { hashPassword } from "@/models/AdminUser"

// GET /api/admin/users — list all admin users
export async function GET() {
  try {
    await connectDB()
    const users = await AdminUser.find({}).select("-password").sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data: users })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// POST /api/admin/users — create admin user
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { username, email, password, role, createdBy } = await req.json()

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, error: "username, email, password required" }, { status: 400 })
    }

    const existing = await AdminUser.findOne({ $or: [{ username }, { email }] })
    if (existing) {
      return NextResponse.json({ success: false, error: "Username or email already exists" }, { status: 409 })
    }

    const user = await AdminUser.create({
      username,
      email,
      password: await hashPassword(password),
      role:     role || "analyst",
      createdBy: createdBy || "superadmin",
    })

    const { password: _, ...safe } = user.toObject()
    return NextResponse.json({ success: true, data: safe }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
