import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Coupon from "@/models/Coupon"
import Order from "@/models/Order"

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

    // Check order-count restriction
    if (coupon.validForOrderCount > 0) {
      const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim()
      if (!email) {
        return NextResponse.json({ success: false, error: "Sign in to use this coupon." }, { status: 400 })
      }
      const prevOrders = await Order.countDocuments({
        "customer.email": email,
        status: { $nin: ["cancelled"] },
      })
      if (prevOrders + 1 !== coupon.validForOrderCount) {
        const nth = coupon.validForOrderCount === 1 ? "1st" : coupon.validForOrderCount === 2 ? "2nd" : coupon.validForOrderCount === 3 ? "3rd" : `${coupon.validForOrderCount}th`
        return NextResponse.json({ success: false, error: `This coupon is only valid for your ${nth} order.` }, { status: 410 })
      }
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
