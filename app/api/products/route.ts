import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Product from "@/models/Product"
import { checkPermission } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category") || ""
    const status   = searchParams.get("status")   || ""
    const tag      = searchParams.get("tag")       || ""
    const featured = searchParams.get("featured")  || ""
    const search   = (searchParams.get("search") || "").trim().slice(0, 100)
    const limit    = parseInt(searchParams.get("limit") || "0")

    const filter: Record<string, unknown> = {}

    if (category) {
      const safe = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100)
      filter.category = { $regex: safe, $options: "i" }
    }
    if (status)         filter.stockStatus = status
    if (tag)            filter.tag = { $regex: `^${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
    if (featured === "true") filter.featured = true
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } },
        { category: { $regex: safe, $options: "i" } },
        { tag: { $regex: safe, $options: "i" } },
      ]
    }

    let query = Product.find(filter).sort({ createdAt: -1 })
    if (limit > 0) query = query.limit(limit)

    const products = await query.lean()
    return NextResponse.json(products)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const denied = checkPermission(req, "products", "create")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })

  try {
    await connectDB()
    const body = await req.json()
    if (!body.name || !body.price) {
      return NextResponse.json({ success: false, error: "name and price required" }, { status: 400 })
    }
    const product = await Product.create(body)
    return NextResponse.json({ success: true, data: product, _id: product._id }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
