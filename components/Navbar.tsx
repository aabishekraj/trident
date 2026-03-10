"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useCart } from "@/context/CartContext"
import CartDrawer from "./cart/CartDrawer"

const MEN_ITEMS = [
  { label: "T-Shirts",    slug: "tshirts"     },
  { label: "Shirts",      slug: "shirts"      },
  { label: "Polo Shirts", slug: "polo-shirts" },
  { label: "Hoodies",     slug: "hoodies"     },
  { label: "Jackets",     slug: "jackets"     },
  { label: "Shorts",      slug: "shorts"      },
  { label: "Shoes",       slug: "shoes"       },
  { label: "Tracksuits",  slug: "tracksuits"  },
]

const WOMEN_ITEMS = [
  { label: "T-Shirts",   slug: "tshirts"    },
  { label: "Crop Tops",  slug: "crop-tops"  },
  { label: "Sports Bra", slug: "sports-bra" },
  { label: "Dresses",    slug: "dresses"    },
  { label: "Yoga Pants", slug: "yoga-pants" },
  { label: "Shorts",     slug: "shorts"     },
  { label: "Shoes",      slug: "shoes"      },
  { label: "Activewear", slug: "activewear" },
]

const KIDS_ITEMS = [
  { label: "Clothing",    slug: "clothing"    },
  { label: "Shoes",       slug: "shoes"       },
  { label: "Accessories", slug: "accessories" },
]

function NavDropdown({ title, gender, items }: { title: string; gender: string; items: { label: string; slug: string }[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <Link href={`/collection/${gender}`}
        style={{ color: open ? "#fff" : "#ccc", fontWeight: 700, fontSize: ".82rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none", padding: "4px 0", borderBottom: open ? "2px solid #e5202e" : "2px solid transparent", transition: "all .2s", display: "block" }}>
        {title}
      </Link>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", background: "#050505", border: "1px solid #1a1a1a", borderTop: "2px solid #e5202e", minWidth: 180, zIndex: 200, marginTop: 8 }}>
          <Link href={`/collection/${gender}`}
            style={{ display: "block", padding: ".75rem 1.25rem", color: "#555", fontSize: ".72rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none", borderBottom: "1px solid #111" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
            onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
            All {title}
          </Link>
          {items.map(item => (
            <Link key={item.slug} href={`/collection/${gender}/${item.slug}`}
              style={{ display: "block", padding: ".65rem 1.25rem", color: "#555", fontSize: ".72rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
              onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { cart } = useCart()
  const [open, setOpen]           = useState(false)
  const [customer, setCustomer]   = useState<{ name: string; email: string } | null>(null)
  const [wishCount, setWishCount] = useState(0)

  const cartTotal = cart.reduce((t, item) => t + item.quantity, 0)

  useEffect(() => {
    const saved = localStorage.getItem("trident_customer")
    if (saved) setCustomer(JSON.parse(saved))

    const wl = JSON.parse(localStorage.getItem("trident_wishlist") || "[]")
    setWishCount(wl.length)

    // Listen for wishlist changes
    const onStorage = () => {
      const wl2 = JSON.parse(localStorage.getItem("trident_wishlist") || "[]")
      setWishCount(wl2.length)
      const cust = localStorage.getItem("trident_customer")
      setCustomer(cust ? JSON.parse(cust) : null)
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return (
    <>
      <nav style={{ position: "fixed", top: 0, width: "100%", background: "rgba(0,0,0,.97)", borderBottom: "1px solid #111", zIndex: 100, fontFamily: "'Barlow', sans-serif" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: 60 }}>

          {/* Logo */}
          <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.7rem", letterSpacing: 5, color: "#f5f5f5", textDecoration: "none" }}>
            TRI<span style={{ color: "#e5202e" }}>DENT</span>
          </Link>

          {/* Center nav */}
          <div style={{ display: "flex", gap: "2.25rem", alignItems: "center" }}>
            <Link href="/" style={{ color: "#888", fontWeight: 700, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
              onMouseLeave={e => (e.currentTarget.style.color = "#888")}>
              HOME
            </Link>
            <NavDropdown title="MEN"   gender="men"   items={MEN_ITEMS}   />
            <NavDropdown title="WOMEN" gender="women" items={WOMEN_ITEMS} />
            <NavDropdown title="KIDS"  gender="kids"  items={KIDS_ITEMS}  />
            <Link href="/collection/unisex" style={{ color: "#888", fontWeight: 700, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
              onMouseLeave={e => (e.currentTarget.style.color = "#888")}>
              UNISEX
            </Link>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            {customer ? (
              <>
                <Link href="/account" style={{ display: "flex", alignItems: "center", gap: ".4rem", color: "#888", fontSize: ".75rem", fontWeight: 700, letterSpacing: 1.5, textDecoration: "none", textTransform: "uppercase" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#888")}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#e5202e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: ".95rem", color: "#fff", flexShrink: 0 }}>
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                  {customer.name.split(" ")[0]}
                </Link>
              </>
            ) : (
              <Link href="/signin" style={{ color: "#888", fontWeight: 700, fontSize: ".75rem", letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
                onMouseLeave={e => (e.currentTarget.style.color = "#888")}>
                SIGN IN
              </Link>
            )}

            {/* Wishlist */}
            <Link href="/account/wishlist" style={{ position: "relative", color: "#888", fontSize: "1.1rem", textDecoration: "none", lineHeight: 1 }}
              title="Wishlist">
              ♡
              {wishCount > 0 && (
                <span style={{ position: "absolute", top: -8, right: -8, background: "#e5202e", color: "#fff", width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".55rem", fontWeight: 800 }}>
                  {wishCount}
                </span>
              )}
            </Link>

            {/* Search */}
            <Link href="/search" style={{ color: "#888", fontSize: "1.05rem", lineHeight: 1, textDecoration: "none" }} title="Search">🔍</Link>

            {/* Cart */}
            <button onClick={() => setOpen(true)} style={{ position: "relative", background: "none", border: "none", color: "#888", fontSize: "1.1rem", cursor: "pointer", lineHeight: 1, padding: 0 }}>
              🛍
              {cartTotal > 0 && (
                <span style={{ position: "absolute", top: -8, right: -8, background: "#e5202e", color: "#fff", width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".55rem", fontWeight: 800 }}>
                  {cartTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <CartDrawer open={open} setOpen={setOpen} />
    </>
  )
}
