import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Coupon from "@/models/Coupon"
import { checkPermission } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  const denied = checkPermission(req, "coupons", "view")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })
  try {
    await connectDB()
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data: coupons })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch coupons" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = checkPermission(req, "coupons", "delete")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })
  try {
    await connectDB()
    const body = await req.json()
    let deleted = 0
    if (body.all) {
      const r = await Coupon.deleteMany({})
      deleted = r.deletedCount
    } else if (Array.isArray(body.ids) && body.ids.length) {
      const r = await Coupon.deleteMany({ _id: { $in: body.ids } })
      deleted = r.deletedCount
    } else {
      return NextResponse.json({ success: false, error: "Provide ids[] or all:true" }, { status: 400 })
    }
    return NextResponse.json({ success: true, deleted })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const denied = checkPermission(req, "coupons", "create")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })

  try {
    await connectDB()
    const body = await req.json()
    if (!body.code || !body.discount) {
      return NextResponse.json({ success: false, error: "code and discount required" }, { status: 400 })
    }
    const coupon = await Coupon.create({ ...body, code: body.code.toUpperCase().trim() })
    return NextResponse.json({ success: true, data: coupon }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("duplicate")) return NextResponse.json({ success: false, error: "Coupon code already exists." }, { status: 409 })
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
