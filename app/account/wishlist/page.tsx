"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { useCurrency } from "@/context/CurrencyContext"

type WishlistItem = {
  _id: string; name: string; price: number; image?: string
  category?: string; sizes?: string[]; stockStatus?: string; couponDiscount?: number
}

function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:") || url.startsWith("/"))
    ? url : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"
}

function getCustomer() {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem("trident_customer") || "null") } catch { return null }
}

export default function WishlistPage() {
  const { addToCart } = useCart()
  const { fmt } = useCurrency()
  const [items,   setItems]   = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const customer = getCustomer()

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (customer) {
        // Server-persisted wishlist: fetch product IDs, then fetch product details
        try {
          const r = await fetch("/api/wishlist", { headers: { "x-customer-email": customer.email } })
          const j = await r.json()
          if (j.success && j.productIds?.length) {
            const products = await fetch("/api/products").then(r => r.json())
            const filtered: WishlistItem[] = Array.isArray(products)
              ? products.filter((p: WishlistItem) => j.productIds.includes(p._id))
              : []
            setItems(filtered)
          } else setItems([])
        } catch { setItems([]) }
      } else {
        // localStorage fallback
        const saved = localStorage.getItem("trident_wishlist")
        setItems(saved ? JSON.parse(saved) : [])
      }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function remove(id: string) {
    setItems(prev => prev.filter(i => i._id !== id))
    if (customer) {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-customer-email": customer.email },
        body: JSON.stringify({ productId: id, action: "remove" }),
      })
    } else {
      const updated = items.filter(i => i._id !== id)
      localStorage.setItem("trident_wishlist", JSON.stringify(updated))
    }
  }

  function moveToCart(item: WishlistItem) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addToCart({ ...item, qty: 1 } as any)
    remove(item._id)
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", letterSpacing: 3, marginBottom: "2rem" }}>
        WISHLIST <span style={{ color: "#e5202e" }}>({items.length})</span>
      </h1>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#555" }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>♡</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 2, marginBottom: ".5rem" }}>YOUR WISHLIST IS EMPTY</div>
          <p style={{ color: "#555", fontSize: ".88rem", marginBottom: "1.5rem", lineHeight: 1.7 }}>
            {customer ? "Tap the ♡ icon on any product to save it here." : "Sign in to save items across devices."}
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" style={{ display: "inline-block", background: "#e5202e", color: "#fff", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>START SHOPPING</Link>
            {!customer && <Link href="/signin" style={{ display: "inline-block", background: "transparent", border: "1px solid #333", color: "#888", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>SIGN IN</Link>}
          </div>
        </div>
      ) : (
        <>
          {/* Sync notice for logged-out users */}
          {!customer && (
            <div style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)", padding: ".75rem 1rem", marginBottom: "1.5rem", fontSize: ".78rem", color: "#3b82f6" }}>
              💡 <Link href="/signin" style={{ color: "#3b82f6", fontWeight: 700 }}>Sign in</Link> to sync your wishlist across devices.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1px", background: "#1e1e1e" }}>
            {items.map(item => {
              const fp = item.couponDiscount ? +(item.price * (1 - item.couponDiscount / 100)).toFixed(2) : item.price
              return (
                <div key={item._id} style={{ background: "#0d0d0d", overflow: "hidden" }}>
                  <div style={{ position: "relative", aspectRatio: "4/5", background: "#0a0a0a" }}>
                    <Image src={safeImg(item.image)} alt={item.name} fill style={{ objectFit: "cover" }} unoptimized />
                    <button onClick={() => remove(item._id)} title="Remove"
                      style={{ position: "absolute", top: ".75rem", right: ".75rem", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.75)", border: "none", color: "#e5202e", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>♥</button>
                    {item.stockStatus === "sold_out" && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", letterSpacing: 3, color: "#e5202e" }}>SOLD OUT</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <div style={{ fontSize: ".6rem", color: "#444", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: ".2rem" }}>{item.category}</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".95rem", marginBottom: ".35rem" }}>{item.name}</div>
                    <div style={{ display: "flex", gap: ".4rem", alignItems: "baseline", marginBottom: ".75rem" }}>
                      <span style={{ fontWeight: 800 }}>{fmt(fp)}</span>
                      {item.couponDiscount ? <span style={{ color: "#555", fontSize: ".75rem", textDecoration: "line-through" }}>{fmt(item.price)}</span> : null}
                    </div>
                    <div style={{ display: "flex", gap: ".5rem" }}>
                      <button onClick={() => moveToCart(item)} disabled={item.stockStatus === "sold_out"}
                        style={{ flex: 1, background: item.stockStatus === "sold_out" ? "#1a1a1a" : "#e5202e", color: item.stockStatus === "sold_out" ? "#444" : "#fff", border: "none", padding: ".6rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".7rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: item.stockStatus === "sold_out" ? "not-allowed" : "pointer" }}>
                        {item.stockStatus === "sold_out" ? "SOLD OUT" : "MOVE TO BAG"}
                      </button>
                      <Link href={`/product/${item._id}`}
                        style={{ padding: ".6rem .75rem", border: "1px solid #1e1e1e", color: "#555", textDecoration: "none", fontSize: ".7rem", display: "flex", alignItems: "center" }}>
                        VIEW
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
