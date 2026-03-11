import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Product from "@/models/Product"
import { checkPermission } from "@/lib/adminAuth"

// POST /api/products/bulk — accepts array of products (admin only)
export async function POST(req: NextRequest) {
  const err = checkPermission(req, "products", "create")
  if (err) return NextResponse.json({ success: false, error: err.error }, { status: err.status })
  try {
    await connectDB()
    const body = await req.json()
    const rows: unknown[] = Array.isArray(body) ? body : body.products

    if (!rows?.length) {
      return NextResponse.json({ success: false, error: "No products provided" }, { status: 400 })
    }

    // Validate and sanitize each row
    const valid: Record<string, unknown>[] = []
    const errors: string[] = []

    rows.forEach((row: unknown, i: number) => {
      const r = row as Record<string, unknown>
      if (!r.name || !r.price) {
        errors.push(`Row ${i + 1}: missing name or price`)
        return
      }
      valid.push({
        name:        String(r.name).trim(),
        description: String(r.description || "").trim(),
        price:       parseFloat(String(r.price)) || 0,
        category:    String(r.category || "Unisex").trim(),
        tag:         String(r.tag || "").trim(),
        sizes:       typeof r.sizes === "string"
          ? r.sizes.split(",").map((s: string) => s.trim()).filter(Boolean)
          : Array.isArray(r.sizes) ? r.sizes : [],
        image:       String(r.image || "").trim(),
        stockStatus: ["active","sold_out","coming_soon"].includes(String(r.stockStatus))
          ? r.stockStatus
          : "active",
        active: r.active !== false && r.active !== "false",
      })
    })

    if (!valid.length) {
      return NextResponse.json({ success: false, error: "No valid rows found", errors }, { status: 400 })
    }

    const created = await Product.insertMany(valid, { ordered: false })
    return NextResponse.json({ success: true, created: created.length, errors }, { status: 201 })
  } catch (e) {
    console.error("[POST /api/products/bulk]", e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
