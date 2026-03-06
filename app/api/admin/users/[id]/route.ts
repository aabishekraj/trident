import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import AdminUser, { hashPassword } from "@/models/AdminUser"

type Params = { params: Promise<{ id: string }> }

// PUT /api/admin/users/[id] — update role, active, or reset password
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    if (body.password) {
      body.password = hashPassword(body.password)
    }

    const user = await AdminUser.findByIdAndUpdate(id, { $set: body }, { new: true }).select("-password").lean()
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: user })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB()
    const { id } = await params
    const user = await AdminUser.findByIdAndDelete(id)
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
