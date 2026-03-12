import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Product from "@/models/Product"
import { checkPermission } from "@/lib/adminAuth"

type P = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: P) {
  try {
    await connectDB()
    const { id } = await params
    const p = await Product.findById(id).lean()
    if (!p) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: p })
  } catch (e) {
    console.error("[GET /api/products/:id]", e)
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: P) {
  const denied = checkPermission(req, "products", "edit")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })

  try {
    await connectDB()
    const { id } = await params
    const raw = await req.json()

    // Allowlist updatable fields — prevent mass assignment of internal/computed fields
    const VALID_STATUS = ["active", "sold_out", "coming_soon"]
    const allowed: Record<string, unknown> = {}

    if (typeof raw.name === "string")         allowed.name         = raw.name.trim().slice(0, 200)
    if (typeof raw.description === "string")  allowed.description  = raw.description.trim().slice(0, 3000)
    if (typeof raw.price === "number")        allowed.price        = Math.max(0, raw.price)
    if (typeof raw.category === "string")     allowed.category     = raw.category.trim().slice(0, 100)
    if (typeof raw.tag === "string")          allowed.tag          = raw.tag.trim().slice(0, 50)
    if (Array.isArray(raw.sizes))             allowed.sizes        = raw.sizes.map((s: unknown) => String(s).trim().slice(0, 20)).filter(Boolean).slice(0, 30)
    if (Array.isArray(raw.colors))            allowed.colors       = raw.colors.map((c: unknown) => String(c).trim().slice(0, 30)).filter(Boolean).slice(0, 20)
    if (typeof raw.image === "string")        allowed.image        = raw.image.slice(0, 2048)
    if (Array.isArray(raw.images))            allowed.images       = raw.images.map((u: unknown) => String(u).slice(0, 2048)).filter(Boolean).slice(0, 10)
    if (VALID_STATUS.includes(String(raw.stockStatus))) allowed.stockStatus = raw.stockStatus
    if (typeof raw.stockQuantity === "number") allowed.stockQuantity = Math.max(0, Math.floor(raw.stockQuantity))
    if (typeof raw.active === "boolean")      allowed.active       = raw.active
    if (typeof raw.featured === "boolean")    allowed.featured     = raw.featured
    if (typeof raw.couponCode === "string")   allowed.couponCode   = raw.couponCode.trim().slice(0, 50)
    if (typeof raw.couponDiscount === "number") allowed.couponDiscount = Math.max(0, Math.min(100, raw.couponDiscount))

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 })
    }

    const p = await Product.findByIdAndUpdate(id, { $set: allowed }, { new: true, runValidators: true }).lean()
    if (!p) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: p })
  } catch (e) {
    console.error("[PUT /api/products/:id]", e)
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: P) {
  const denied = checkPermission(req, "products", "delete")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })

  try {
    await connectDB()
    const { id } = await params
    await Product.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[DELETE /api/products/:id]", e)
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 })
  }
}
