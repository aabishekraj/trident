"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/CartContext"
import { useCurrency } from "@/context/CurrencyContext"

// ── Types ─────────────────────────────────────────────────────────────────────
type Product = {
  _id: string; name: string; price: number; originalPrice?: number
  image?: string; tag?: string; category?: string; description?: string
  sizes?: string[]; stockStatus?: "active" | "sold_out" | "coming_soon"
  couponCode?: string; couponDiscount?: number
}
type Customer = { name: string; email: string; token: string }

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Men",
    href: "/collection/men",
    dropdown: [
      { label: "T-Shirts",     href: "/collection/men/tshirts" },
      { label: "Shirts",       href: "/collection/men/shirts" },
      { label: "Hoodies",      href: "/collection/men/hoodies" },
      { label: "Shorts",       href: "/collection/men/shorts" },
      { label: "Shoes",        href: "/collection/men/shoes" },
      { label: "Jackets",      href: "/collection/men/jackets" },
      { label: "Accessories",  href: "/collection/men/accessories" },
    ],
  },
  {
    label: "Women",
    href: "/collection/women",
    dropdown: [
      { label: "T-Shirts",     href: "/collection/women/tshirts" },
      { label: "Dresses",      href: "/collection/women/dresses" },
      { label: "Shorts",       href: "/collection/women/shorts" },
      { label: "Shoes",        href: "/collection/women/shoes" },
      { label: "Jackets",      href: "/collection/women/jackets" },
      { label: "Activewear",   href: "/collection/women/activewear" },
      { label: "Accessories",  href: "/collection/women/accessories" },
    ],
  },
  {
    label: "Kids",
    href: "/collection/kids",
    dropdown: [
      { label: "Clothing",     href: "/collection/kids/clothing" },
      { label: "Shoes",        href: "/collection/kids/shoes" },
      { label: "Accessories",  href: "/collection/kids/accessories" },
    ],
  },
  {
    label: "New Arrivals",
    href: "/collection/tag/NEW",
    dropdown: [
      { label: "NEW",       href: "/collection/tag/NEW"       },
      { label: "HOT",       href: "/collection/tag/HOT"       },
      { label: "LIMITED",   href: "/collection/tag/LIMITED"   },
      { label: "EXCLUSIVE", href: "/collection/tag/EXCLUSIVE" },
    ],
  },
]

// ── Fallback products ─────────────────────────────────────────────────────────
const FALLBACK: Product[] = [
  { _id:"f1", name:"Air Flux X — Pro",   price:189, tag:"NEW",       category:"Running",    stockStatus:"active",    image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", sizes:["S","M","L","XL"] },
  { _id:"f2", name:"Vertex Runner 2.0",  price:149, tag:"HOT",       category:"Training",   stockStatus:"active",    image:"https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80", sizes:["M","L","XL"] },
  { _id:"f3", name:"Shadow Force Elite", price:229, tag:"",          category:"Basketball", stockStatus:"active",    image:"https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&q=80", sizes:["S","M","L"] },
  { _id:"f4", name:"Pulse Drift Low",    price:119, tag:"SALE",      category:"Lifestyle",  stockStatus:"sold_out",  image:"https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80", sizes:["XS","S","M"] },
  { _id:"f5", name:"Strike Force V",     price:179, tag:"",          category:"Football",   stockStatus:"active",    image:"https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80", sizes:["M","L","XL","XXL"] },
  { _id:"f6", name:"Phantom Air Max",    price:259, tag:"EXCLUSIVE", category:"Running",    stockStatus:"coming_soon",image:"https://images.unsplash.com/photo-1584735175315-9d5df23be8b4?w=600&q=80", sizes:["S","M","L"] },
]

const MARQUEE = ["PERFORMANCE","★","INNOVATION","★","TRIDENT","★","JUST DO IT","★","NEW ARRIVALS","★","SS 2026","★","FREE SHIPPING","★","PERFORMANCE","★","INNOVATION","★","TRIDENT","★","JUST DO IT","★","NEW ARRIVALS","★","SS 2026","★","FREE SHIPPING","★"]

// ── Helpers ───────────────────────────────────────────────────────────────────
function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:")) ? url : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"
}
function finalPrice(p: { price: number; couponDiscount?: number }) {
  return p.couponDiscount ? +(p.price * (1 - p.couponDiscount / 100)).toFixed(2) : p.price
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter()
  const { cart, addToCart: ctxAdd, removeFromCart: ctxRemove, applyCoupon: ctxApplyCoupon, cartCount, openCart, closeCart, cartOpen } = useCart()
  const { fmt, shippingFreeThreshold } = useCurrency()
  const [products, setProducts]   = useState<Product[]>([])
  const [couponCode, setCouponCode] = useState("")
  const [couponMsg, setCouponMsg]   = useState("")
  const [couponOk, setCouponOk]     = useState(false)
  const [customer, setCustomer]     = useState<Customer | null>(null)
  const [sizeModal, setSizeModal]   = useState<Product | null>(null)
  const [chosenSize, setChosenSize] = useState("")

  // Load customer session
  useEffect(() => {
    const saved = localStorage.getItem("trident_customer")
    if (saved) setCustomer(JSON.parse(saved))
  }, [])

  // Fetch featured products first; fall back to latest 10 if none
  useEffect(() => {
    fetch("/api/products?featured=true&limit=10")
      .then(r => r.json())
      .then(async (d) => {
        const list = Array.isArray(d) ? d : d?.data
        if (Array.isArray(list) && list.length) { setProducts(list); return }
        // No featured products — fall back to latest 10
        const r2 = await fetch("/api/products?limit=10&sort=newest")
        const d2 = await r2.json()
        const list2 = Array.isArray(d2) ? d2 : d2?.data
        if (Array.isArray(list2) && list2.length) setProducts(list2)
        else setProducts(FALLBACK)
      })
      .catch(() => setProducts(FALLBACK))
  }, [])

  // Cart derived (CartContext provides cartCount; compute subtotal locally)
  const cartSubtotal = cart.reduce((s, i) => s + finalPrice(i) * i.quantity, 0)

  function openSizeModal(p: Product) {
    if (p.stockStatus === "sold_out" || p.stockStatus === "coming_soon") return
    if (!p.sizes?.length) { addToCart(p, undefined); return }
    setSizeModal(p); setChosenSize("")
  }

  function addToCart(product: Product, size?: string) {
    ctxAdd({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      size,
      couponDiscount: product.couponDiscount,
      couponCode: product.couponCode,
    })
    setSizeModal(null)
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return
    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponCode.trim())}`)
      const j = await res.json()
      if (j.success) {
        setCouponOk(true)
        setCouponMsg(`✓ ${j.data.discount}% off applied!`)
        ctxApplyCoupon(j.data.code, j.data.discount)
      } else {
        setCouponOk(false)
        setCouponMsg("Invalid or expired coupon.")
      }
    } catch {
      setCouponMsg("Error applying coupon.")
    }
  }

  function handleCheckout() {
    if (!cart.length) return
    // CartContext already syncs to sessionStorage("trident_cart") on every change
    sessionStorage.setItem("trident_cart_total", String(cartSubtotal.toFixed(2)))
    closeCart()
    router.push("/checkout")
  }

  function signOut() {
    localStorage.removeItem("trident_customer")
    setCustomer(null)
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <main style={{ background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2.5rem", height: 64,
        background: "rgba(10,10,10,0.97)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid #1e1e1e",
      }}>
        {/* Logo */}
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>
          TRIDENT
        </Link>

        {/* Dropdown nav */}
        <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
          {NAV_ITEMS.map(item => (
            <div key={item.label} className="nav-item" style={{ position: "relative", padding: "20px 0" }}>
              <Link href={item.href} className="nav-link" style={{ textDecoration: "none" }}>{item.label}</Link>
              {/* Dropdown */}
              <div className="nav-dropdown" style={{
                position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                background: "#0d0d0d", border: "1px solid #1e1e1e",
                minWidth: 180, zIndex: 100, padding: ".5rem 0",
              }}>
                <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", width: 10, height: 10, background: "#0d0d0d", borderTop: "1px solid #1e1e1e", borderLeft: "1px solid #1e1e1e", rotate: "45deg" }} />
                {item.dropdown.map(d => (
                  <Link key={d.label} href={d.href} style={{
                    display: "block", padding: ".65rem 1.2rem",
                    color: "#888", fontSize: ".8rem", fontWeight: 600,
                    letterSpacing: 1, textTransform: "uppercase",
                    textDecoration: "none", transition: "all .15s",
                    borderLeft: "2px solid transparent",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f5f5f5"; (e.currentTarget as HTMLElement).style.borderLeftColor = "#e5202e"; (e.currentTarget as HTMLElement).style.paddingLeft = "1.5rem" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#888"; (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent"; (e.currentTarget as HTMLElement).style.paddingLeft = "1.2rem" }}
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>

          {/* Customer auth */}
          {customer ? (
            <div style={{ position: "relative" }} className="nav-item">
              <button className="nav-link" style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                {/* Avatar */}
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#e5202e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".78rem", fontWeight: 800, flexShrink: 0 }}>
                  {customer.name.charAt(0).toUpperCase()}
                </span>
                <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.name.split(" ")[0]}</span>
                <span style={{ color: "#555", fontSize: ".6rem" }}>▾</span>
              </button>
              {/* Dropdown menu */}
              <div className="nav-dropdown" style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0,
                background: "#0d0d0d", border: "1px solid #1e1e1e",
                minWidth: 180, zIndex: 100,
              }}>
                {/* User info header */}
                <div style={{ padding: ".85rem 1.2rem", borderBottom: "1px solid #141414" }}>
                  <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#f5f5f5" }}>{customer.name}</div>
                  <div style={{ fontSize: ".72rem", color: "#555", marginTop: ".2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.email}</div>
                </div>
                {[
                  { label: "My Orders",   href: "/account/orders"  },
                  { label: "Account",     href: "/account" },
                  { label: "Wishlist",    href: "/account/wishlist" },
                  { label: "Support",     href: "/support" },
                ].map(item => (
                  <Link key={item.href} href={item.href} style={{ display: "block", padding: ".65rem 1.2rem", color: "#888", fontSize: ".8rem", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", transition: "all .15s", borderLeft: "2px solid transparent" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f5f5f5"; (e.currentTarget as HTMLElement).style.borderLeftColor = "#e5202e"; (e.currentTarget as HTMLElement).style.paddingLeft = "1.5rem" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#888"; (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent"; (e.currentTarget as HTMLElement).style.paddingLeft = "1.2rem" }}
                  >{item.label}</Link>
                ))}
                {/* Divider */}
                <div style={{ margin: ".3rem 0", borderTop: "1px solid #141414" }} />
                {/* Sign out — prominently styled */}
                <button onClick={signOut} style={{
                  display: "flex", alignItems: "center", gap: ".5rem",
                  width: "100%", padding: ".75rem 1.2rem",
                  color: "#e5202e", fontSize: ".8rem", fontWeight: 700,
                  letterSpacing: 1, textTransform: "uppercase",
                  background: "none", border: "none", cursor: "pointer",
                  transition: "background .15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(229,32,46,.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <span style={{ fontSize: ".9rem" }}>⏻</span> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link href="/signin" style={{
              color: "#888", fontWeight: 700, fontSize: ".78rem",
              letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none",
              transition: "color .2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
              onMouseLeave={e => (e.currentTarget.style.color = "#888")}
            >
              SIGN IN
            </Link>
          )}

          {/* Cart */}
          <button onClick={openCart} style={{
            position: "relative", background: "none", border: "none",
            color: "#f5f5f5", fontSize: "1.15rem", cursor: "pointer", padding: "4px",
          }}>
            🛒
            {cartCount > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -6,
                background: "#e5202e", color: "#fff", width: 18, height: 18,
                borderRadius: "50%", fontSize: ".6rem", fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section style={{ height: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: 64 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#000 0%,#0a0a0a 40%,#160808 100%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(255,255,255,.025) 80px),repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(255,255,255,.025) 80px)" }} />
        <div style={{ position: "relative", zIndex: 2, padding: "0 2.5rem", maxWidth: 860 }}>
          <p className="fade-up" style={{ fontSize: ".75rem", fontWeight: 800, letterSpacing: 5, textTransform: "uppercase", color: "#e5202e", marginBottom: "1rem" }}>New Season — SS 2026</p>
          <h1 className="fade-up delay-1" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(5rem,14vw,12rem)", lineHeight: .88, letterSpacing: -2, marginBottom: "1.5rem" }}>
            JUST<br /><span style={{ color: "#e5202e" }}>DO</span><br />IT.
          </h1>
          <p className="fade-up delay-2" style={{ fontSize: "1.05rem", fontWeight: 300, color: "#777", maxWidth: 380, lineHeight: 1.65, marginBottom: "2.5rem" }}>
            Performance meets obsession. Engineered for those who don&apos;t stop.
          </p>
          <div className="fade-up delay-3" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button onClick={() => document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })}
              style={{ background: "#f5f5f5", color: "#0a0a0a", border: "none", padding: ".9rem 2.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".82rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; (e.currentTarget as HTMLElement).style.color = "#0a0a0a" }}>
              SHOP NOW
            </button>
            <button onClick={() => document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })}
              style={{ background: "transparent", color: "#f5f5f5", border: "1px solid #2a2a2a", padding: ".9rem 2.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".82rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#f5f5f5" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a" }}>
              EXPLORE
            </button>
          </div>
        </div>
        <div style={{ position: "absolute", right: "3rem", top: "50%", transform: "translateY(-50%)", width: 108, height: 108, borderRadius: "50%", border: "1px solid #222", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed', sans-serif" }}>
          <span style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>26</span>
          <span style={{ fontSize: ".62rem", letterSpacing: 2, textTransform: "uppercase", color: "#777", textAlign: "center" }}>SS<br />Collection</span>
        </div>
      </section>

      {/* ══ MARQUEE ═══════════════════════════════════════════════════════════ */}
      <div style={{ overflow: "hidden", borderTop: "1px solid #1e1e1e", borderBottom: "1px solid #1e1e1e", padding: ".55rem 0", background: "#0d0d0d" }}>
        <div className="marquee-track">
          {MARQUEE.map((t, i) => (
            <span key={i} style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: ".95rem", letterSpacing: 4, color: t === "★" ? "#e5202e" : "#555", padding: "0 1.5rem" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ══ PRODUCTS ══════════════════════════════════════════════════════════ */}
      <section id="featured" style={{ padding: "6rem 0", background: "#070707" }}>
        {/* Section header */}
        <div style={{ padding: "0 2.5rem", maxWidth: 1320, margin: "0 auto 3.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <p style={{ fontSize: ".72rem", fontWeight: 800, letterSpacing: 5, textTransform: "uppercase", color: "#e5202e", marginBottom: ".6rem" }}>New Season — SS 2026</p>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.8rem,6vw,5rem)", letterSpacing: 2, lineHeight: .9 }}>
                FEATURED<br /><span style={{ color: "#e5202e" }}>DROPS</span>
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".75rem" }}>
              <p style={{ color: "#555", fontSize: ".85rem", maxWidth: 300, textAlign: "right", lineHeight: 1.6 }}>
                Handpicked drops. Maximum impact. Zero compromise.
              </p>
              <Link href="/collection/men" style={{ color: "#888", fontSize: ".78rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none", transition: "color .2s", display: "flex", alignItems: "center", gap: ".4rem" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
                onMouseLeave={e => (e.currentTarget.style.color = "#888")}>
                View All →
              </Link>
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 2rem", margin: "0 2.5rem", border: "1px solid #1e1e1e", color: "#444" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: 2, marginBottom: ".5rem", color: "#555" }}>LOADING COLLECTION…</div>
            <p style={{ fontSize: ".82rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>Curating the best drops for you.</p>
          </div>
        ) : (
          <>
            {/* Hero product (first) + side grid */}
            <div style={{ padding: "0 2.5rem", maxWidth: 1320, margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", marginBottom: "2px" }}>
                {/* Hero card — spans full height */}
                <HeroProductCard product={products[0]} onAdd={() => openSizeModal(products[0])} />
                {/* Right: 2×2 grid of next 4 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "2px" }}>
                  {products.slice(1, 5).map((p, i) => (
                    <ProductCard key={p._id} product={p} index={i + 1} onAdd={() => openSizeModal(p)} compact />
                  ))}
                </div>
              </div>
              {/* Bottom row: remaining 5 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "2px" }}>
                {products.slice(5, 10).map((p, i) => (
                  <ProductCard key={p._id} product={p} index={i + 5} onAdd={() => openSizeModal(p)} compact />
                ))}
              </div>
            </div>

            {/* EXPLORE COLLECTIONS CTA */}
            <div style={{ textAlign: "center", marginTop: "4rem", padding: "0 2.5rem" }}>
              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
                <p style={{ color: "#555", fontSize: ".82rem", letterSpacing: 2, textTransform: "uppercase" }}>Discover the full range</p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <Link href="/collection/men" style={{
                    background: "#f5f5f5", color: "#0a0a0a", padding: ".9rem 3rem",
                    fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".8rem",
                    letterSpacing: 3, textTransform: "uppercase", textDecoration: "none",
                    transition: "all .2s", display: "inline-block",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; (e.currentTarget as HTMLElement).style.color = "#0a0a0a" }}>
                    EXPLORE COLLECTIONS
                  </Link>
                  <Link href="/collection/women" style={{
                    background: "transparent", color: "#888", border: "1px solid #2a2a2a",
                    padding: ".9rem 2rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700,
                    fontSize: ".8rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none",
                    transition: "all .2s", display: "inline-block",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#888"; (e.currentTarget as HTMLElement).style.color = "#f5f5f5" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.color = "#888" }}>
                    WOMEN&apos;S →
                  </Link>
                  <Link href="/collection/men" style={{
                    background: "transparent", color: "#888", border: "1px solid #2a2a2a",
                    padding: ".9rem 2rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700,
                    fontSize: ".8rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none",
                    transition: "all .2s", display: "inline-block",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#888"; (e.currentTarget as HTMLElement).style.color = "#f5f5f5" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.color = "#888" }}>
                    MEN&apos;S →
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ══ SIZE MODAL ════════════════════════════════════════════════════════ */}
      {sizeModal && (
        <>
          <div onClick={() => setSizeModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 1600 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#0d0d0d", border: "1px solid #1e1e1e", zIndex: 1601, width: 360, maxWidth: "95vw", padding: "2rem" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: 2, marginBottom: ".3rem" }}>SELECT SIZE</div>
            <div style={{ color: "#666", fontSize: ".8rem", marginBottom: "1.5rem" }}>{sizeModal.name}</div>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {sizeModal.sizes?.map(s => (
                <button key={s} className={`size-chip ${chosenSize === s ? "selected" : ""}`} onClick={() => setChosenSize(s)}>{s}</button>
              ))}
            </div>
            <button onClick={() => { if (chosenSize) addToCart(sizeModal, chosenSize) }}
              disabled={!chosenSize}
              style={{ width: "100%", background: chosenSize ? "#e5202e" : "#222", color: chosenSize ? "#fff" : "#555", border: "none", padding: ".85rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".82rem", letterSpacing: 2, textTransform: "uppercase", cursor: chosenSize ? "pointer" : "not-allowed" }}>
              ADD TO BAG
            </button>
          </div>
        </>
      )}

      {/* ══ CART OVERLAY ══════════════════════════════════════════════════════ */}
      {cartOpen && <div onClick={closeCart} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 1400 }} />}

      {/* ══ CART DRAWER ═══════════════════════════════════════════════════════ */}
      <div className={`cart-drawer ${cartOpen ? "open" : ""}`}
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, background: "#0a0a0a", borderLeft: "1px solid #1e1e1e", zIndex: 1500, display: "flex", flexDirection: "column" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.4rem 1.5rem", borderBottom: "1px solid #1e1e1e" }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: 3 }}>YOUR BAG ({cartCount})</span>
          <button onClick={closeCart} style={{ background: "none", border: "none", color: "#f5f5f5", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "#555" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛒</div>
              <div style={{ fontSize: ".9rem" }}>Your bag is empty</div>
              <button onClick={() => { closeCart(); document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" }) }}
                style={{ marginTop: "1.5rem", background: "none", border: "1px solid #222", color: "#888", padding: ".6rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontSize: ".78rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
                CONTINUE SHOPPING
              </button>
            </div>
          ) : cart.map(item => {
            const fp = finalPrice(item)
            return (
              <div key={item.id + (item.size || "")} style={{ display: "flex", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid #141414" }}>
                <div style={{ position: "relative", width: 80, height: 80, background: "#111", flexShrink: 0 }}>
                  <Image src={safeImg(item.image)} alt={item.name} fill style={{ objectFit: "cover" }} unoptimized />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: ".88rem", marginBottom: ".2rem" }}>{item.name}</div>
                  {item.size && <div style={{ color: "#666", fontSize: ".75rem", marginBottom: ".3rem" }}>Size: {item.size}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <span style={{ fontWeight: 700, fontSize: ".9rem" }}>{fmt(fp)}</span>
                    {item.couponDiscount && <span style={{ color: "#888", fontSize: ".75rem", textDecoration: "line-through" }}>{fmt(item.price)}</span>}
                  </div>
                  {item.couponDiscount && <div style={{ color: "#e5202e", fontSize: ".72rem", fontWeight: 700, marginTop: ".2rem" }}>-{item.couponDiscount}% applied</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: ".5rem" }}>
                    <span style={{ color: "#666", fontSize: ".8rem" }}>Qty: {item.quantity}</span>
                  </div>
                </div>
                <button onClick={() => ctxRemove(item.id, item.size)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: ".9rem", alignSelf: "flex-start", transition: "color .2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#e5202e")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#444")}>✕</button>
              </div>
            )
          })}
        </div>

        {/* Coupon */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #141414" }}>
          <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem" }}>
            <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="COUPON CODE" className="trident-input"
              style={{ flex: 1, fontSize: ".8rem", padding: ".6rem 1rem" }}
              onKeyDown={e => e.key === "Enter" && applyCoupon()}
            />
            <button onClick={applyCoupon}
              style={{ background: "#1e1e1e", color: "#888", border: "none", padding: ".6rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".75rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#1e1e1e"; (e.currentTarget as HTMLElement).style.color = "#888" }}>
              APPLY
            </button>
          </div>
          {couponMsg && <div style={{ fontSize: ".78rem", color: couponOk ? "#22c55e" : "#e5202e", fontWeight: 600 }}>{couponMsg}</div>}
        </div>

        {/* Total + Checkout */}
        <div style={{ padding: "1.2rem 1.5rem", borderTop: "1px solid #1e1e1e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", marginBottom: "1.2rem" }}>
            <span>SUBTOTAL</span>
            <span>${cartSubtotal.toFixed(2)}</span>
          </div>
          <button onClick={handleCheckout} disabled={cart.length === 0}
            style={{ width: "100%", background: cart.length ? "#f5f5f5" : "#222", color: cart.length ? "#0a0a0a" : "#555", border: "none", padding: "1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase", cursor: cart.length ? "pointer" : "not-allowed", transition: "all .2s", marginBottom: ".75rem" }}
            onMouseEnter={e => { if (cart.length) { (e.currentTarget as HTMLElement).style.background = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#fff" } }}
            onMouseLeave={e => { if (cart.length) { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; (e.currentTarget as HTMLElement).style.color = "#0a0a0a" } }}>
            PROCEED TO CHECKOUT →
          </button>
          {!customer && (
            <p style={{ textAlign: "center", fontSize: ".75rem", color: "#555" }}>
              <Link href="/signin" style={{ color: "#e5202e", textDecoration: "none" }} onClick={closeCart}>Sign in</Link>
              {" "}to track your order
            </p>
          )}
        </div>
      </div>

      {/* ══ BRAND VALUE STRIP ══════════════════════════════════════════════ */}
      <section style={{ background: "#050505", borderTop: "1px solid #1e1e1e", borderBottom: "1px solid #1e1e1e", padding: "3.5rem 2.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "3rem", maxWidth: 1100, margin: "0 auto" }}>
          {[
            { icon: "🚚", title: "Free Shipping",      sub: `On all orders over ${fmt(shippingFreeThreshold)}. Fast & tracked delivery worldwide.` },
            { icon: "↩",  title: "Easy Returns",       sub: "30-day hassle-free returns. No questions asked."            },
            { icon: "🔒", title: "Secure Checkout",    sub: "256-bit SSL encryption. Your data is always safe."          },
            { icon: "⚡", title: "Member Rewards",     sub: "Earn points on every purchase. Redeem for exclusive perks."  },
          ].map(({ icon, title, sub }) => (
            <div key={title} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.4rem", flexShrink: 0, marginTop: ".1rem" }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: ".88rem", letterSpacing: .5, marginBottom: ".4rem" }}>{title}</div>
                <div style={{ color: "#555", fontSize: ".8rem", lineHeight: 1.6 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer style={{ background: "#050505", borderTop: "1px solid #1e1e1e", paddingTop: "4rem" }}>
        {/* Main footer grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "3rem", padding: "0 2.5rem 3rem" }}>
          {/* Brand */}
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 4, marginBottom: "1rem" }}>TRIDENT</div>
            <p style={{ color: "#555", fontSize: ".85rem", lineHeight: 1.7, maxWidth: 260, marginBottom: "1.5rem" }}>
              Performance meets obsession. Built for those who demand more from every move.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              {["𝕏", "IG", "YT", "TK"].map(s => (
                <button key={s} style={{ width: 36, height: 36, border: "1px solid #1e1e1e", background: "transparent", color: "#555", fontSize: ".75rem", fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#e5202e" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e"; (e.currentTarget as HTMLElement).style.color = "#555" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".85rem", letterSpacing: 3, textTransform: "uppercase", color: "#f5f5f5", marginBottom: "1.2rem" }}>Shop</div>
            {["Men", "Women", "Kids", "New Arrivals", "Sale", "Collections"].map(l => (
              <a key={l} href="#" className="footer-link">{l}</a>
            ))}
          </div>

          {/* Help */}
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".85rem", letterSpacing: 3, textTransform: "uppercase", color: "#f5f5f5", marginBottom: "1.2rem" }}>Help</div>
            {["Order Tracking", "Shipping & Returns", "Size Guide", "FAQ", "Contact Us", "Store Locator"].map(l => (
              <a key={l} href="#" className="footer-link">{l}</a>
            ))}
          </div>

          {/* Company */}
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".85rem", letterSpacing: 3, textTransform: "uppercase", color: "#f5f5f5", marginBottom: "1.2rem" }}>Company</div>
            {["About Us", "Careers", "Press", "Sustainability", "Investors", "Affiliate"].map(l => (
              <a key={l} href="#" className="footer-link">{l}</a>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".85rem", letterSpacing: 3, textTransform: "uppercase", color: "#f5f5f5", marginBottom: "1.2rem" }}>Newsletter</div>
            <p style={{ color: "#555", fontSize: ".82rem", lineHeight: 1.6, marginBottom: "1rem" }}>Get early access to drops & exclusive offers.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
              <input placeholder="Your email" className="trident-input" style={{ fontSize: ".82rem", padding: ".6rem .8rem" }} />
              <button style={{ background: "#e5202e", color: "#fff", border: "none", padding: ".65rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".75rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>SUBSCRIBE</button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid #1e1e1e", padding: "1.2rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ color: "#444", fontSize: ".78rem" }}>© 2026 TRIDENT. All rights reserved.</div>
          <div style={{ display: "flex", gap: "2rem" }}>
            {["Privacy Policy", "Terms of Service", "Cookie Settings"].map(l => (
              <a key={l} href="#" style={{ color: "#444", fontSize: ".75rem", textDecoration: "none", transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#888")}
                onMouseLeave={e => (e.currentTarget.style.color = "#444")}>
                {l}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
            {["VISA", "MC", "AMEX", "UPI", "GPay"].map(p => (
              <span key={p} style={{ border: "1px solid #1e1e1e", color: "#444", fontSize: ".65rem", fontWeight: 700, padding: ".2rem .5rem", letterSpacing: 1 }}>{p}</span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}

// ── Hero Product Card (large, left col) ────────────────────────────────────
function HeroProductCard({ product: p, onAdd }: { product: Product; onAdd: () => void }) {
  const { fmt } = useCurrency()
  const fp = finalPrice(p)
  const isSoldOut    = p.stockStatus === "sold_out"
  const isComingSoon = p.stockStatus === "coming_soon"
  const [wishlisted, setWishlisted] = useState(false)

  useEffect(() => {
    const wl: Product[] = JSON.parse(localStorage.getItem("trident_wishlist") || "[]")
    setWishlisted(wl.some(x => x._id === p._id))
  }, [p._id])

  function toggleWishlist(e: React.MouseEvent) {
    e.stopPropagation()
    const wl: Product[] = JSON.parse(localStorage.getItem("trident_wishlist") || "[]")
    const updated = wishlisted ? wl.filter(x => x._id !== p._id) : [...wl, p]
    localStorage.setItem("trident_wishlist", JSON.stringify(updated))
    setWishlisted(!wishlisted)
  }

  return (
    <div style={{ position: "relative", background: "#0d0d0d", overflow: "hidden" }}>
      <Link href={`/product/${p._id}`} style={{ textDecoration: "none", display: "block" }}>
        <div style={{ position: "relative", height: 640, overflow: "hidden" }}>
          <Image src={safeImg(p.image)} alt={p.name} fill style={{ objectFit: "cover", transition: "transform .7s ease" }} unoptimized
            onMouseEnter={e => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)")}
            onMouseLeave={e => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.1) 55%, transparent 100%)" }} />
          {/* Badges */}
          <div style={{ position: "absolute", top: "1.25rem", left: "1.25rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            {p.tag && !isSoldOut && !isComingSoon && (
              <span style={{ background: "#e5202e", color: "#fff", fontSize: ".68rem", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", padding: ".3rem .8rem" }}>{p.tag}</span>
            )}
            {p.couponDiscount && (
              <span style={{ background: "#22c55e", color: "#fff", fontSize: ".68rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: ".3rem .8rem" }}>-{p.couponDiscount}% OFF</span>
            )}
          </div>
          {/* Wishlist */}
          <button onClick={toggleWishlist}
            style={{ position: "absolute", top: "1.25rem", right: "1.25rem", width: 36, height: 36, borderRadius: "50%", background: wishlisted ? "#e5202e" : "rgba(0,0,0,.5)", border: `1px solid ${wishlisted ? "#e5202e" : "#333"}`, color: wishlisted ? "#fff" : "#888", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
            {wishlisted ? "♥" : "♡"}
          </button>
          {/* Status overlay */}
          {(isSoldOut || isComingSoon) && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 4, color: isSoldOut ? "#e5202e" : "#eab308" }}>
                {isSoldOut ? "SOLD OUT" : "COMING SOON"}
              </span>
            </div>
          )}
          {/* Bottom overlay text */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem 1.75rem" }}>
            {p.category && <div style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#e5202ecc", marginBottom: ".5rem" }}>{p.category}</div>}
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", letterSpacing: 2, color: "#f5f5f5", lineHeight: 1, marginBottom: ".75rem" }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: ".6rem" }}>
                <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "#f5f5f5" }}>{fmt(fp)}</span>
                {p.couponDiscount && <span style={{ color: "#777", fontSize: "1rem", textDecoration: "line-through" }}>{fmt(p.price)}</span>}
              </div>
              {!isSoldOut && !isComingSoon && (
                <button onClick={e => { e.preventDefault(); onAdd() }}
                  style={{ background: "#f5f5f5", color: "#0a0a0a", border: "none", padding: ".65rem 1.75rem", fontFamily: "'Barlow', sans-serif", fontSize: ".78rem", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; (e.currentTarget as HTMLElement).style.color = "#0a0a0a" }}>
                  ADD TO BAG
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product: p, index, onAdd, compact = false }: { product: Product; index: number; onAdd: () => void; compact?: boolean }) {
  const { fmt } = useCurrency()
  const fp = finalPrice(p)
  const isSoldOut    = p.stockStatus === "sold_out"
  const isComingSoon = p.stockStatus === "coming_soon"
  const [wishlisted, setWishlisted] = useState(false)

  useEffect(() => {
    const wl: Product[] = JSON.parse(localStorage.getItem("trident_wishlist") || "[]")
    setWishlisted(wl.some(x => x._id === p._id))
  }, [p._id])

  function toggleWishlist(e: React.MouseEvent) {
    e.stopPropagation()
    const wl: Product[] = JSON.parse(localStorage.getItem("trident_wishlist") || "[]")
    let updated: Product[]
    if (wishlisted) { updated = wl.filter(x => x._id !== p._id) }
    else { updated = [...wl, p] }
    localStorage.setItem("trident_wishlist", JSON.stringify(updated))
    setWishlisted(!wishlisted)
  }

  const imgH = compact ? 220 : 320

  return (
    <div className="product-card" style={{ background: "#0a0a0a", overflow: "hidden", position: "relative", animationDelay: `${index * 0.07}s` }}>
      <div style={{ position: "relative", height: imgH, background: "#0d0d0d", overflow: "hidden" }}>
        <Image src={safeImg(p.image)} alt={p.name} fill style={{ objectFit: "cover", transition: "transform .55s ease" }} unoptimized
          onMouseEnter={e => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)")}
          onMouseLeave={e => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
        />
        {/* Tag */}
        {p.tag && !isSoldOut && !isComingSoon && (
          <span style={{ position: "absolute", top: "1rem", left: "1rem", background: "#e5202e", color: "#fff", fontSize: ".65rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: ".3rem .7rem" }}>{p.tag}</span>
        )}
        {/* Wishlist button */}
        <button onClick={toggleWishlist} title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{ position: "absolute", top: ".75rem", right: ".75rem", width: 32, height: 32, borderRadius: "50%", background: wishlisted ? "#e5202e" : "rgba(0,0,0,.6)", border: `1px solid ${wishlisted ? "#e5202e" : "#333"}`, color: wishlisted ? "#fff" : "#888", fontSize: ".9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
          {wishlisted ? "♥" : "♡"}
        </button>
        {/* Coupon badge */}
        {p.couponDiscount && (
          <span className="coupon-badge" style={{ position: "absolute", bottom: "1rem", left: "1rem", background: "#22c55e", color: "#fff", fontSize: ".65rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: ".3rem .7rem" }}>-{p.couponDiscount}% OFF</span>
        )}
        {/* Status overlay */}
        {(isSoldOut || isComingSoon) && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: 3, color: isSoldOut ? "#e5202e" : "#eab308" }}>
              {isSoldOut ? "SOLD OUT" : "COMING SOON"}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "1.2rem 1.5rem 1.5rem" }}>
        {p.category && <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".35rem" }}>{p.category}</div>}
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.35rem", fontWeight: 700, marginBottom: ".8rem" }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: ".5rem" }}>
            <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>{fmt(fp)}</span>
            {p.couponDiscount && <span style={{ color: "#555", fontSize: ".85rem", textDecoration: "line-through" }}>{fmt(p.price)}</span>}
          </div>
          {!isSoldOut && !isComingSoon && (
            <button className="product-add-btn" onClick={onAdd}
              style={{ background: "#f5f5f5", color: "#0a0a0a", border: "none", padding: ".45rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".72rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
              ADD TO BAG
            </button>
          )}
        </div>
        {p.sizes && p.sizes.length > 0 && !isSoldOut && !isComingSoon && (
          <div style={{ display: "flex", gap: ".3rem", marginTop: ".75rem", flexWrap: "wrap" }}>
            {p.sizes.slice(0, 5).map(s => <span key={s} style={{ border: "1px solid #1e1e1e", color: "#555", fontSize: ".65rem", fontWeight: 700, padding: ".2rem .5rem" }}>{s}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}
