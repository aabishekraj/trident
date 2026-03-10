import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Product from "@/models/Product"
import { checkPermission } from "@/lib/adminAuth"

export async function POST(req: NextRequest) {
  const denied = checkPermission(req, "products", "delete")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })

  try {
    await connectDB()
    const { ids } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "ids array is required" }, { status: 400 })
    }
    const result = await Product.deleteMany({ _id: { $in: ids } })
    return NextResponse.json({ success: true, deleted: result.deletedCount })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
