import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Review from "@/models/Review"
import Product from "@/models/Product"
import Order from "@/models/Order"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET /api/reviews?productId=xxx
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const productId = new URL(req.url).searchParams.get("productId")
    if (!productId || productId.length > 100) {
      return NextResponse.json({ success: false, error: "productId required" }, { status: 400 })
    }
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).limit(50).lean()
    return NextResponse.json({ success: true, data: reviews })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 })
  }
}

// POST /api/reviews  { productId, orderId?, rating, title, body, customerEmail, customerName }
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const data = await req.json()
    const { productId, orderId, rating, title, body, customerEmail, customerName } = data

    // Validate required fields
    if (!productId || !rating || !body || !customerEmail || !customerName) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const email = String(customerEmail).toLowerCase().trim()
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 })
    }

    // Validate rating range
    const ratingNum = Number(rating)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ success: false, error: "Rating must be an integer 1-5" }, { status: 400 })
    }

    // Sanitize text inputs — strip control characters, enforce length limits
    const safeBody  = String(body).trim().replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "").slice(0, 2000)
    const safeTitle = title ? String(title).trim().replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "").slice(0, 200) : ""
    const safeName  = String(customerName).trim().replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "").slice(0, 100)
    const safeProductId = String(productId).slice(0, 100)
    const safeOrderId   = orderId ? String(orderId).slice(0, 50) : ""

    if (!safeBody) {
      return NextResponse.json({ success: false, error: "Review body cannot be empty" }, { status: 400 })
    }

    // Check if customer already reviewed this product
    const existing = await Review.findOne({ productId: safeProductId, customerEmail: email })
    if (existing) {
      return NextResponse.json({ success: false, error: "You have already reviewed this product" }, { status: 409 })
    }

    // Mark as verified only if order ID is provided AND customer actually placed that order
    let verified = false
    if (safeOrderId) {
      const order = await Order.findOne({ orderId: safeOrderId, "customer.email": email })
      if (order) verified = true
    }

    const review = await Review.create({
      productId: safeProductId,
      orderId:   safeOrderId,
      customerEmail: email,
      customerName:  safeName,
      rating:   ratingNum,
      title:    safeTitle,
      body:     safeBody,
      verified,
    })

    // Update product aggregate rating
    const agg = await Review.aggregate([
      { $match: { productId: safeProductId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])
    if (agg.length > 0) {
      await Product.findByIdAndUpdate(safeProductId, {
        avgRating:   +agg[0].avg.toFixed(1),
        reviewCount: agg[0].count,
      })
    }

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (e) {
    console.error("[POST /api/reviews]", e)
    return NextResponse.json({ success: false, error: "Failed to submit review" }, { status: 500 })
  }
}
