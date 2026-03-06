import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Product from "@/models/Product"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  await connectDB()

  const { id } = await params

  await Product.findByIdAndDelete(id)

  return NextResponse.json({ success: true })
}