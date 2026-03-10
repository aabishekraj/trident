import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Review from "@/models/Review"
import Product from "@/models/Product"
import Order from "@/models/Order"

// GET /api/reviews?productId=xxx
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const productId = new URL(req.url).searchParams.get("productId")
    if (!productId) return NextResponse.json({ success: false, error: "productId required" }, { status: 400 })
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).limit(50).lean()
    return NextResponse.json({ success: true, data: reviews })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// POST /api/reviews  { productId, orderId?, rating, title, body, customerEmail, customerName }
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { productId, orderId, rating, title, body, customerEmail, customerName } = await req.json()

    if (!productId || !rating || !body || !customerEmail || !customerName) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Rating must be 1-5" }, { status: 400 })
    }

    // Check if customer already reviewed
    const existing = await Review.findOne({ productId, customerEmail: customerEmail.toLowerCase() })
    if (existing) return NextResponse.json({ success: false, error: "You have already reviewed this product" }, { status: 409 })

    // Mark as verified if they actually ordered the product
    let verified = false
    if (orderId) {
      const order = await Order.findOne({ orderId, "customer.email": customerEmail.toLowerCase() })
      if (order) verified = true
    }

    const review = await Review.create({ productId, orderId: orderId || "", customerEmail: customerEmail.toLowerCase(), customerName, rating, title: title || "", body, verified })

    // Update product aggregate rating
    const agg = await Review.aggregate([
      { $match: { productId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])
    if (agg.length > 0) {
      await Product.findByIdAndUpdate(productId, { avgRating: +agg[0].avg.toFixed(1), reviewCount: agg[0].count })
    }

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
