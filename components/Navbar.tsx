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
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={`/collection/${gender}`}
        style={{
          color: open ? "#f5f5f5" : "rgba(245,245,245,0.5)",
          fontWeight: 700, fontSize: ".78rem", letterSpacing: 2.5,
          textTransform: "uppercase", textDecoration: "none",
          padding: "4px 0", display: "block",
          borderBottom: `1px solid ${open ? "#e5202e" : "transparent"}`,
          transition: "all .2s",
        }}
      >
        {title}
      </Link>
      <div style={{
        position: "absolute", top: "calc(100% + 14px)", left: "50%",
        transform: `translateX(-50%) translateY(${open ? "0" : "6px"})`,
        background: "#080808", border: "1px solid #1a1a1a",
        borderTop: "2px solid #e5202e",
        minWidth: 200, zIndex: 200,
        opacity: open ? 1 : 0,
        pointerEvents: open ? "all" : "none",
        transition: "all .2s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <Link
          href={`/collection/${gender}`}
          style={{
            display: "block", padding: ".7rem 1.25rem",
            color: "#333", fontSize: ".7rem", fontWeight: 800,
            letterSpacing: 2.5, textTransform: "uppercase", textDecoration: "none",
            borderBottom: "1px solid #111",
            transition: "color .15s, padding-left .15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f5f5f5"; (e.currentTarget as HTMLElement).style.paddingLeft = "1.5rem" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#333"; (e.currentTarget as HTMLElement).style.paddingLeft = "1.25rem" }}
        >
          All {title}
        </Link>
        {items.map(item => (
          <Link
            key={item.slug}
            href={`/collection/${gender}/${item.slug}`}
            style={{
              display: "block", padding: ".6rem 1.25rem",
              color: "#444", fontSize: ".7rem", fontWeight: 700,
              letterSpacing: 2, textTransform: "uppercase", textDecoration: "none",
              transition: "color .15s, padding-left .15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f5f5f5"; (e.currentTarget as HTMLElement).style.paddingLeft = "1.5rem" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#444"; (e.currentTarget as HTMLElement).style.paddingLeft = "1.25rem" }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Navbar() {
  const { cart, openCart, cartCount } = useCart()
  const [customer, setCustomer]   = useState<{ name: string; email: string } | null>(null)
  const [wishCount, setWishCount] = useState(0)
  const [scrolled, setScrolled]   = useState(false)

  const cartTotal = cartCount ?? cart.reduce((t, item) => t + item.quantity, 0)

  useEffect(() => {
    const saved = localStorage.getItem("trident_customer")
    if (saved) setCustomer(JSON.parse(saved))

    const wl = JSON.parse(localStorage.getItem("trident_wishlist") || "[]")
    setWishCount(wl.length)

    const onStorage = () => {
      const wl2 = JSON.parse(localStorage.getItem("trident_wishlist") || "[]")
      setWishCount(wl2.length)
      const cust = localStorage.getItem("trident_customer")
      setCustomer(cust ? JSON.parse(cust) : null)
    }
    window.addEventListener("storage", onStorage)

    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  const iconBtn: React.CSSProperties = {
    position: "relative", background: "none", border: "none",
    color: "rgba(245,245,245,0.5)", cursor: "pointer", padding: "4px",
    lineHeight: 1, transition: "color .2s", fontSize: "1rem",
    display: "flex", alignItems: "center", justifyContent: "center",
  }

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, width: "100%",
        background: scrolled ? "rgba(5,5,5,0.98)" : "rgba(5,5,5,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? "#111" : "transparent"}`,
        zIndex: 100,
        fontFamily: "'Barlow', sans-serif",
        transition: "background .3s, border-color .3s",
      }}>
        <div style={{
          maxWidth: 1320, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 2rem", height: 62,
        }}>

          {/* Logo */}
          <Link href="/" style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.65rem",
            letterSpacing: 5, color: "#f5f5f5", textDecoration: "none",
            flexShrink: 0,
          }}>
            TRI<span style={{ color: "#e5202e" }}>DENT</span>
          </Link>

          {/* Center nav */}
          <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
            <Link href="/" style={{
              color: "rgba(245,245,245,0.5)", fontWeight: 700, fontSize: ".78rem",
              letterSpacing: 2.5, textTransform: "uppercase", textDecoration: "none",
              transition: "color .2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,245,245,0.5)")}
            >
              Home
            </Link>
            <NavDropdown title="Men"   gender="men"   items={MEN_ITEMS}   />
            <NavDropdown title="Women" gender="women" items={WOMEN_ITEMS} />
            <NavDropdown title="Kids"  gender="kids"  items={KIDS_ITEMS}  />
            <Link href="/collection/unisex" style={{
              color: "rgba(245,245,245,0.5)", fontWeight: 700, fontSize: ".78rem",
              letterSpacing: 2.5, textTransform: "uppercase", textDecoration: "none",
              transition: "color .2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,245,245,0.5)")}
            >
              Unisex
            </Link>
          </div>

          {/* Right side icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>

            {/* Customer */}
            {customer ? (
              <Link href="/account" style={{
                display: "flex", alignItems: "center", gap: ".4rem",
                color: "rgba(245,245,245,0.5)", fontSize: ".72rem", fontWeight: 700,
                letterSpacing: 1.5, textDecoration: "none", textTransform: "uppercase",
                transition: "color .2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,245,245,0.5)")}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: "50%", background: "#e5202e",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: ".85rem", color: "#fff",
                  flexShrink: 0,
                }}>
                  {customer.name.charAt(0).toUpperCase()}
                </span>
                <span style={{ display: "none" }}>{customer.name.split(" ")[0]}</span>
              </Link>
            ) : (
              <Link href="/signin" style={{
                color: "rgba(245,245,245,0.5)", fontWeight: 700, fontSize: ".72rem",
                letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none",
                transition: "color .2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,245,245,0.5)")}
              >
                Sign In
              </Link>
            )}

            {/* Thin divider */}
            <span style={{ width: 1, height: 16, background: "#1e1e1e", display: "block" }} />

            {/* Wishlist */}
            <Link href="/account/wishlist" style={{ ...iconBtn, textDecoration: "none" } as React.CSSProperties} title="Wishlist"
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#f5f5f5")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(245,245,245,0.5)")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {wishCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#e5202e", color: "#fff",
                  width: 14, height: 14, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: ".5rem", fontWeight: 800,
                }}>
                  {wishCount}
                </span>
              )}
            </Link>

            {/* Search */}
            <Link href="/search" style={{ ...iconBtn, textDecoration: "none" } as React.CSSProperties} title="Search"
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#f5f5f5")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(245,245,245,0.5)")}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </Link>

            {/* Cart */}
            <button onClick={openCart} style={iconBtn} title="Cart"
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#f5f5f5")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(245,245,245,0.5)")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {cartTotal > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#e5202e", color: "#fff",
                  width: 14, height: 14, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: ".5rem", fontWeight: 800,
                }}>
                  {cartTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <CartDrawer />
    </>
  )
}
