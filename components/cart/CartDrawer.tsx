"use client"

import { useCart } from "@/context/CartContext"
import Link from "next/link"

export default function CartDrawer({ open, setOpen }: any) {

  const {
    cart,
    removeFromCart,
    increaseQty,
    decreaseQty
  } = useCart()

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  return (

    <div
      className={`fixed top-0 right-0 h-full w-105 bg-white shadow-2xl transform transition-transform duration-500 z-50 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >

      <div className="flex flex-col h-full">

        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b">

          <h2 className="text-xl font-semibold">
            Cart
          </h2>

          <button
            onClick={() => setOpen(false)}
            className="text-xl"
          >
            ✕
          </button>

        </div>


        {/* CART ITEMS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {cart.length === 0 && (
            <p className="text-gray-500">
              Your cart is empty
            </p>
          )}

          {cart.map(item => (

            <div
              key={`${item.id}-${item.size}`}
              className="flex gap-4"
            >

              <img
                src={item.image}
                className="w-24 h-24 object-cover"
              />

              <div className="flex flex-col flex-1">

                <h3 className="font-semibold">
                  {item.name}
                </h3>

                <p className="text-sm text-gray-500">
                  Size {item.size}
                </p>

                <p className="font-medium mt-1">
                  ${item.price}
                </p>


                {/* QUANTITY */}
                <div className="flex items-center gap-3 mt-3">

                  <button
                    onClick={() =>
                      decreaseQty(item.id, item.size)
                    }
                    className="border w-8 h-8"
                  >
                    −
                  </button>

                  <span>
                    {item.quantity ?? 1}
                  </span>

                  <button
                    onClick={() =>
                      increaseQty(item.id, item.size)
                    }
                    className="border w-8 h-8"
                  >
                    +
                  </button>

                </div>


                <button
                  onClick={() =>
                    removeFromCart(item.id, item.size)
                  }
                  className="text-sm text-red-500 mt-3"
                >
                  Remove
                </button>

              </div>

            </div>

          ))}

        </div>


        {/* FOOTER */}
        <div className="border-t p-6">

          <div className="flex justify-between mb-4">

            <span className="font-semibold">
              Subtotal
            </span>

            <span className="font-semibold">
              ${subtotal.toFixed(2)}
            </span>

          </div>

          

<Link href="/checkout">

<button
 className="w-full bg-black text-white py-4 font-semibold hover:bg-gray-800 transition"
>
 Checkout
</button>

</Link>

        </div>

      </div>

    </div>
  )
}