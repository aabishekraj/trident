"use client"

import { useCart } from "@/context/CartContext"
import Image from "next/image"

export default function CheckoutPage() {

  const {
    cart,
    removeFromCart,
    updateQuantity
  } = useCart()

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const handleCheckout = async () => {

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ cart })
    })

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl">
        Your cart is empty
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-8 py-24">

      <h1 className="text-4xl font-bold mb-12">
        Checkout
      </h1>

      <div className="grid md:grid-cols-2 gap-16">

        {/* Cart Items */}
        <div className="space-y-8">

          {cart.map((item) => (

            <div
              key={`${item.id}-${item.size}`}
              className="flex gap-6 border-b border-neutral-800 pb-6"
            >

              <Image
                src={item.image}
                alt={item.name}
                width={120}
                height={120}
                className="object-cover"
              />

              <div className="flex flex-col flex-1">

                <h2 className="font-semibold text-lg">
                  {item.name}
                </h2>

                <p className="text-neutral-400">
                  Size: {item.size}
                </p>

                <p className="mt-2">
                  ${item.price}
                </p>

                {/* Quantity */}
                <div className="flex items-center gap-4 mt-4">

                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.size, item.quantity - 1)
                    }
                    className="w-8 h-8 border border-neutral-700"
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.size, item.quantity + 1)
                    }
                    className="w-8 h-8 border border-neutral-700"
                  >
                    +
                  </button>

                </div>

                <button
                  onClick={() =>
                    removeFromCart(item.id, item.size)
                  }
                  className="text-red-500 text-sm mt-3"
                >
                  Remove
                </button>

              </div>

            </div>

          ))}

        </div>

        {/* Summary */}
        <div className="bg-neutral-900 p-10 h-fit">

          <h2 className="text-2xl font-semibold mb-6">
            Order Summary
          </h2>

          <div className="flex justify-between mb-4">
            <span>Items</span>
            <span>{cart.length}</span>
          </div>

          <div className="flex justify-between mb-8">
            <span>Total</span>
            <span className="text-xl font-bold">
              ${total}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full bg-white text-black py-4 font-semibold hover:bg-neutral-200 transition"
          >
            Pay Securely
          </button>

        </div>

      </div>

    </div>
  )
}