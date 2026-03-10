import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Review from "@/models/Review"
import Product from "@/models/Product"
import { getAdminSession } from "@/lib/adminAuth"

type P = { params: Promise<{ id: string }> }

// DELETE /api/reviews/[id]  — admin only
export async function DELETE(req: NextRequest, { params }: P) {
  if (!getAdminSession(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  try {
    await connectDB()
    const { id } = await params
    const review = await Review.findByIdAndDelete(id)
    if (!review) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

    // Recalculate product aggregate
    const agg = await Review.aggregate([
      { $match: { productId: review.productId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])
    await Product.findByIdAndUpdate(review.productId, {
      avgRating: agg.length > 0 ? +agg[0].avg.toFixed(1) : 0,
      reviewCount: agg.length > 0 ? agg[0].count : 0,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
