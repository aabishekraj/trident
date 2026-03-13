import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Coupon from "@/models/Coupon"
import { checkPermission } from "@/lib/adminAuth"

type P = { params: Promise<{ id: string }> }

// Allowlist of fields that can be updated via the API
const ALLOWED_FIELDS = ["code", "discount", "type", "scope", "categories", "productIds",
  "minOrderValue", "maxUses", "expiresAt", "active", "description", "validForOrderCount"] as const

export async function PUT(req: NextRequest, { params }: P) {
  const denied = checkPermission(req, "coupons", "edit")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })

  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    // Only allow whitelisted fields — prevents mass assignment
    const update: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in body) update[field] = body[field]
    }
    if (update.code && typeof update.code === "string") {
      update.code = update.code.toUpperCase().trim()
    }

    const coupon = await Coupon.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean()
    if (!coupon) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: coupon })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update coupon" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: P) {
  const denied = checkPermission(req, "coupons", "delete")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })

  try {
    await connectDB()
    const { id } = await params
    await Coupon.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to delete coupon" }, { status: 500 })
  }
}
