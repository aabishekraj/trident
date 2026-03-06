import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Coupon from "@/models/Coupon"

type P = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: P) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const coupon = await Coupon.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true }).lean()
    if (!coupon) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: coupon })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: P) {
  try {
    await connectDB()
    const { id } = await params
    await Coupon.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
