"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCurrency } from "@/context/CurrencyContext"

type Product = {
  _id: string; name: string; price: number; image?: string
  category?: string; stockStatus?: string; couponDiscount?: number
}

function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:"))
    ? url : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=70"
}

export default function RecentlyViewed({ exclude }: { exclude?: string }) {
  const { fmt } = useCurrency()
  const [items, setItems] = useState<Product[]>([])

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("trident_recently_viewed") || "[]")
    if (!ids.length) return

    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const filtered = ids
          .filter(id => id !== exclude)
          .map(id => data.find((p: Product) => p._id === id))
          .filter(Boolean)
          .slice(0, 6) as Product[]
        setItems(filtered)
      })
      .catch(() => {})
  }, [exclude])

  if (!items.length) return null

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem 2rem 4rem" }}>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: 2, marginBottom: "1.5rem" }}>
        RECENTLY <span style={{ color: "#e5202e" }}>VIEWED</span>
      </h2>
      <div style={{ display: "flex", gap: "1px", background: "#1e1e1e", overflowX: "auto" }}>
        {items.map(p => {
          const fp   = p.couponDiscount ? +(p.price * (1 - p.couponDiscount / 100)).toFixed(2) : p.price
          const sold = p.stockStatus === "sold_out"
          return (
            <Link key={p._id} href={`/product/${p._id}`} style={{ textDecoration: "none", color: "inherit", background: "#0d0d0d", minWidth: 180, flexShrink: 0 }}>
              <div style={{ position: "relative", height: 220, background: "#111", overflow: "hidden" }}>
                <Image src={safeImg(p.image)} alt={p.name} fill style={{ objectFit: "cover", transition: "transform .4s" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1.05)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
                  unoptimized />
                {sold && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: ".9rem", letterSpacing: 2, color: "#e5202e" }}>SOLD OUT</span>
                  </div>
                )}
              </div>
              <div style={{ padding: ".75rem 1rem" }}>
                <div style={{ fontSize: ".6rem", color: "#444", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: ".15rem" }}>{p.category}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".88rem", marginBottom: ".2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontWeight: 800, fontSize: ".85rem" }}>{fmt(fp)}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
