import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Product from "@/models/Product"
import { checkPermission } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category") || ""
    const status   = searchParams.get("status") || ""
    const filter: Record<string, unknown> = {}
    // Escape user input to prevent ReDoS via malicious regex patterns
    if (category) {
      const safe = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100)
      filter.category = { $regex: safe, $options: "i" }
    }
    if (status) filter.stockStatus = status
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean()
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
