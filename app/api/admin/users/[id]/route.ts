import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import AdminUser, { hashPassword } from "@/models/AdminUser"
import { checkPermission } from "@/lib/adminAuth"

const VALID_ROLES = ["superadmin", "manager", "order_manager", "analyst"]
type Params = { params: Promise<{ id: string }> }

// PUT /api/admin/users/[id] — update role, active, or reset password
export async function PUT(req: NextRequest, { params }: Params) {
  const err = checkPermission(req, "users", "edit")
  if (err) return NextResponse.json({ success: false, error: err.error }, { status: err.status })
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    // Only allow safe fields to be updated; prevent mass-assignment
    const update: Record<string, unknown> = {}
    if (body.role && VALID_ROLES.includes(body.role)) update.role = body.role
    if (typeof body.active === "boolean") update.active = body.active
    if (body.password) update.password = await hashPassword(String(body.password))

    const user = await AdminUser.findByIdAndUpdate(id, { $set: update }, { new: true }).select("-password").lean()
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: user })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const err = checkPermission(req, "users", "delete")
  if (err) return NextResponse.json({ success: false, error: err.error }, { status: err.status })
  try {
    await connectDB()
    const { id } = await params
    const user = await AdminUser.findByIdAndDelete(id)
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 })
  }
}
