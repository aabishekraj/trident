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
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: P) {
  const denied = checkPermission(req, "products", "edit")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })

  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const p = await Product.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true }).lean()
    if (!p) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: p })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
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
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
