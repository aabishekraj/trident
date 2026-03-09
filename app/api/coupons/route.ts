import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Coupon from "@/models/Coupon"
import { checkPermission } from "@/lib/adminAuth"

export async function GET() {
  try {
    await connectDB()
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data: coupons })
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
