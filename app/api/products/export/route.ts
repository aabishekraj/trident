import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Product from "@/models/Product"
import { getAdminSession } from "@/lib/adminAuth"

function escape(val: unknown): string {
  const s = String(val ?? "").replace(/"/g, '""')
  return `"${s}"`
}

export async function GET(req: NextRequest) {
  if (!getAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    await connectDB()
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(10000).lean()

    const header = ["ID","Name","Price","Category","Tag","Sizes","Colors","Stock Status","Stock Qty","Featured","Active","Avg Rating","Review Count","Created"]
    const rows = products.map(p => [
      p._id?.toString(), p.name, p.price, p.category, p.tag || "",
      (p.sizes as string[] || []).join("|"),
      (p.colors as string[] || []).join("|"),
      p.stockStatus, p.stockQuantity ?? 0,
      p.featured ? "Yes" : "No", p.active ? "Yes" : "No",
      p.avgRating ?? 0, p.reviewCount ?? 0,
      new Date(p.createdAt as Date).toISOString().slice(0,10),
    ].map(escape).join(","))

    const csv = [header.map(escape).join(","), ...rows].join("\n")
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="trident-products-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
