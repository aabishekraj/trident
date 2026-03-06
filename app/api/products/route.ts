import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Product from "@/models/Product"

export async function GET() {
  await connectDB()
  const products = await Product.find()
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  await connectDB()

  const body = await req.json()

  const product = await Product.create({
    name: body.name,
    price: body.price,
    image: body.image,
  })

  return NextResponse.json(product)
}