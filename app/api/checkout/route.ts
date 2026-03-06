import Stripe from "stripe"
import { NextResponse } from "next/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {

  const { cart } = await req.json()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",

    line_items: cart.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name
        },
        unit_amount: item.price * 100
      },
      quantity: item.quantity
    })),

    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/checkout"
  })

  return NextResponse.json({
    url: session.url
  })
}