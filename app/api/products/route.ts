import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Product from "@/models/Product"
import { checkPermission } from "@/lib/adminAuth"

const ESC = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category") || ""
    const status   = searchParams.get("status")   || ""
    const tag      = searchParams.get("tag")       || ""
    const featured = searchParams.get("featured")  || ""
    const search   = (searchParams.get("search") || "").trim().slice(0, 100)
    const limitRaw = parseInt(searchParams.get("limit") || "0")
    const limit    = isNaN(limitRaw) ? 0 : Math.min(Math.max(0, limitRaw), 500)

    const filter: Record<string, unknown> = {}

    if (category) {
      filter.category = { $regex: ESC(category.slice(0, 100)), $options: "i" }
    }
    // Strict enum check — never pass raw user input as a value into an equality filter
    if (status && ["active", "sold_out", "coming_soon"].includes(status)) {
      filter.stockStatus = status
    }
    if (tag) {
      filter.tag = { $regex: `^${ESC(tag.slice(0, 50))}$`, $options: "i" }
    }
    if (featured === "true") filter.featured = true
    if (search) {
      const safe = ESC(search)
      filter.$or = [
        { name:        { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } },
        { category:    { $regex: safe, $options: "i" } },
        { tag:         { $regex: safe, $options: "i" } },
      ]
    }

    let query = Product.find(filter).sort({ createdAt: -1 })
    if (limit > 0) query = query.limit(limit)

    const products = await query.lean()
    return NextResponse.json(products)
  } catch (e) {
    console.error("[GET /api/products]", e)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// Allowed product fields — prevents mass assignment of internal fields (_id, avgRating, etc.)
function sanitizeProductBody(body: Record<string, unknown>) {
  const VALID_STATUS = ["active", "sold_out", "coming_soon"]
  return {
    name:          typeof body.name === "string"        ? body.name.trim().slice(0, 200)       : undefined,
    description:   typeof body.description === "string" ? body.description.trim().slice(0, 3000) : "",
    price:         typeof body.price === "number"       ? Math.max(0, body.price)               : undefined,
    category:      typeof body.category === "string"    ? body.category.trim().slice(0, 100)    : "",
    tag:           typeof body.tag === "string"         ? body.tag.trim().slice(0, 50)           : "",
    sizes:         Array.isArray(body.sizes)
                     ? (body.sizes as unknown[]).map(s => String(s).trim().slice(0, 20)).filter(Boolean).slice(0, 30)
                     : [],
    colors:        Array.isArray(body.colors)
                     ? (body.colors as unknown[]).map(c => String(c).trim().slice(0, 30)).filter(Boolean).slice(0, 20)
                     : [],
    image:         typeof body.image === "string"       ? body.image.slice(0, 1000)              : "",
    images:        Array.isArray(body.images)
                     ? (body.images as unknown[]).map(u => String(u).slice(0, 2048)).filter(Boolean).slice(0, 10)
                     : [],
    stockStatus:   VALID_STATUS.includes(String(body.stockStatus)) ? body.stockStatus as string : "active",
    stockQuantity: typeof body.stockQuantity === "number" ? Math.max(0, Math.floor(body.stockQuantity)) : 0,
    active:        body.active !== false,
    featured:      body.featured === true,
    couponCode:    typeof body.couponCode === "string"  ? body.couponCode.trim().slice(0, 50)   : undefined,
    couponDiscount: typeof body.couponDiscount === "number"
                     ? Math.max(0, Math.min(100, body.couponDiscount)) : undefined,
  }
}

export async function POST(req: NextRequest) {
  const denied = checkPermission(req, "products", "create")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })

  try {
    await connectDB()
    const raw = await req.json()
    const data = sanitizeProductBody(raw as Record<string, unknown>)

    if (!data.name || data.price === undefined) {
      return NextResponse.json({ success: false, error: "name and price are required" }, { status: 400 })
    }

    const product = await Product.create(data)
    return NextResponse.json({ success: true, data: product, _id: product._id }, { status: 201 })
  } catch (e) {
    console.error("[POST /api/products]", e)
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 })
  }
}
