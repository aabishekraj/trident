import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Wishlist from "@/models/Wishlist"

function getEmail(req: NextRequest): string | null {
  const auth = req.headers.get("x-customer-email")
  if (auth && auth.includes("@")) return auth.toLowerCase().trim()
  return null
}

// GET /api/wishlist  — returns { productIds: string[] }
export async function GET(req: NextRequest) {
  const email = getEmail(req)
  if (!email) return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 })
  try {
    await connectDB()
    const wl = await Wishlist.findOne({ customerEmail: email }).lean()
    return NextResponse.json({ success: true, productIds: wl?.productIds ?? [] })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// POST /api/wishlist  { productId, action: "add" | "remove" }
export async function POST(req: NextRequest) {
  const email = getEmail(req)
  if (!email) return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 })
  try {
    await connectDB()
    const { productId, action } = await req.json()
    if (!productId) return NextResponse.json({ success: false, error: "productId required" }, { status: 400 })

    let wl = await Wishlist.findOne({ customerEmail: email })
    if (!wl) wl = await Wishlist.create({ customerEmail: email, productIds: [] })

    if (action === "remove") {
      wl.productIds = wl.productIds.filter((id: string) => id !== productId)
    } else {
      if (!wl.productIds.includes(productId)) wl.productIds.push(productId)
    }
    await wl.save()
    return NextResponse.json({ success: true, productIds: wl.productIds })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
