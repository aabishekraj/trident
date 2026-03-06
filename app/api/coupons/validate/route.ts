import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Coupon from "@/models/Coupon"

// GET /api/coupons/validate?code=TRIDENT20
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const code = req.nextUrl.searchParams.get("code")?.toUpperCase()
    if (!code) return NextResponse.json({ success: false, error: "Code required" }, { status: 400 })

    const coupon = await Coupon.findOne({ code, active: true })
    if (!coupon) return NextResponse.json({ success: false, error: "Invalid coupon code." }, { status: 404 })

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: "This coupon has expired." }, { status: 410 })
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ success: false, error: "Coupon usage limit reached." }, { status: 410 })
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
        scope: coupon.scope,
        categories: coupon.categories,
        minOrderValue: coupon.minOrderValue,
      }
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
