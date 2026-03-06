"use client"

import Link from "next/link"
import { useState } from "react"
import { useCart } from "@/context/CartContext"
import CartDrawer from "./cart/CartDrawer"
import DropdownMenu from "./DropdownMenu"
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {

  const { cart } = useCart()
  const { data: session } = useSession()

  const [open,setOpen] = useState(false)

  const total = cart.reduce(
    (t,item)=>t + item.quantity,0
  )

  return (

    <>
      <nav className="fixed top-0 w-full bg-black text-white z-50 border-b border-neutral-800">

        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">

          {/* LOGO */}
          <Link href="/" className="text-xl font-extrabold tracking-widest">
            TRIDENT
          </Link>


          {/* CENTER NAV */}
          <div className="flex gap-8 text-sm font-semibold items-center">

            <Link href="/">HOME</Link>

            <DropdownMenu
              title="MEN"
              items={[
                "T-Shirts",
                "Shirts",
                "Polo Shirts",
                "Hoodies",
                "Jackets",
                "Shorts",
                "Tracksuits"
              ]}
            />

            <DropdownMenu
              title="WOMEN"
              items={[
                "Sports Bra",
                "Crop Tops",
                "Yoga Pants",
                "Oversized Tees",
                "Jackets",
                "Shorts",
                "Activewear"
              ]}
            />

            <Link href="/collection">
              COLLECTION
            </Link>

          </div>


          {/* RIGHT SIDE */}
          <div className="flex items-center gap-6 text-sm">

            {/* AUTH SECTION */}

            {session ? (

              <>
                <span className="text-neutral-300">
                  {session.user?.name}
                </span>

                <button
                  onClick={()=>signOut()}
                  className="hover:text-gray-300"
                >
                  LOGOUT
                </button>

                {/* future admin link */}
                {session.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                  <Link
                    href="/admin"
                    className="border border-white px-3 py-1 hover:bg-white hover:text-black transition"
                  >
                    ADMIN
                  </Link>
                )}
              </>

            ) : (

              <>
                <Link href="/login" className="hover:text-gray-300">
                  LOGIN
                </Link>

                <Link
                  href="/signup"
                  className="border border-white px-3 py-1 hover:bg-white hover:text-black transition"
                >
                  SIGN UP
                </Link>
              </>

            )}


            {/* CART */}
            <div
              className="cursor-pointer relative"
              onClick={()=>setOpen(true)}
            >

              🛒

              {total > 0 && (

                <span className="absolute -top-2 -right-3 bg-red-500 text-xs px-2 py-1 rounded-full">
                  {total}
                </span>

              )}

            </div>

          </div>

        </div>

      </nav>

      <CartDrawer open={open} setOpen={setOpen} />
    </>
  )
}