"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

type WishlistItem = {
  _id: string; name: string; price: number; image?: string
  category?: string; sizes?: string[]; stockStatus?: string
}

function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:"))
    ? url
    : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"
}

export default function WishlistPage() {
  const router   = useRouter()
  const [items,   setItems]   = useState<WishlistItem[]>([])
  const [removed, setRemoved] = useState<Set<string>>(new Set())

  useEffect(() => {
    const saved = localStorage.getItem("trident_wishlist")
    if (saved) setItems(JSON.parse(saved))
  }, [])

  function removeFromWishlist(id: string) {
    setRemoved(prev => new Set([...prev, id]))
    const updated = items.filter(i => i._id !== id)
    setItems(updated)
    localStorage.setItem("trident_wishlist", JSON.stringify(updated))
  }

  function addToCart(item: WishlistItem) {
    const existing = JSON.parse(sessionStorage.getItem("trident_cart") || "[]")
    const key = item._id
    const idx = existing.findIndex((x: { _id: string }) => x._id === key)
    if (idx >= 0) { existing[idx].qty += 1 }
    else { existing.push({ ...item, qty: 1 }) }
    sessionStorage.setItem("trident_cart", JSON.stringify(existing))
    router.push("/checkout")
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", letterSpacing: 3, marginBottom: "2rem" }}>
        WISHLIST <span style={{ color: "#e5202e" }}>({items.length})</span>
      </h1>

      {items.length === 0 ? (
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>♡</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 2, marginBottom: ".5rem" }}>
            YOUR WISHLIST IS EMPTY
          </div>
          <p style={{ color: "#555", fontSize: ".88rem", marginBottom: "1.5rem", lineHeight: 1.7 }}>
            Save items you love to your wishlist.<br />
            Tap the ♡ icon on any product to add it here.
          </p>
          <Link href="/" style={{ display: "inline-block", background: "#e5202e", color: "#fff", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
            START SHOPPING
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1px", background: "#1e1e1e" }}>
          {items.map(item => (
            <div key={item._id} style={{ background: "#0d0d0d", overflow: "hidden" }}>
              {/* Image */}
              <div style={{ position: "relative", aspectRatio: "4/5", background: "#0a0a0a" }}>
                <Image src={safeImg(item.image)} alt={item.name} fill style={{ objectFit: "cover" }} unoptimized />
                {/* Remove button */}
                <button onClick={() => removeFromWishlist(item._id)}
                  title="Remove from wishlist"
                  style={{ position: "absolute", top: ".75rem", right: ".75rem", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.7)", border: "none", color: "#e5202e", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ♥
                </button>
                {item.stockStatus === "sold_out" && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", letterSpacing: 3, color: "#e5202e" }}>SOLD OUT</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: "1rem" }}>
                <div style={{ fontSize: ".65rem", color: "#444", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: ".2rem" }}>{item.category}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".95rem", marginBottom: ".4rem" }}>{item.name}</div>
                <div style={{ fontWeight: 800, marginBottom: ".75rem" }}>${item.price}</div>
                <button onClick={() => addToCart(item)} disabled={item.stockStatus === "sold_out"}
                  style={{ width: "100%", background: item.stockStatus === "sold_out" ? "#1a1a1a" : "#e5202e", color: item.stockStatus === "sold_out" ? "#444" : "#fff", border: "none", padding: ".6rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".72rem", letterSpacing: 2, textTransform: "uppercase", cursor: item.stockStatus === "sold_out" ? "not-allowed" : "pointer" }}>
                  {item.stockStatus === "sold_out" ? "SOLD OUT" : "ADD TO BAG"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
