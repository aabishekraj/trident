"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useCurrency } from "@/context/CurrencyContext"

type Product = {
  _id: string; name: string; price: number
  image?: string; tag?: string; category?: string
  sizes?: string[]; stockStatus?: "active" | "sold_out" | "coming_soon"
  couponDiscount?: number; stockQuantity?: number
}

type RecentItem = { _id: string; name: string; price: number; image?: string }

const TAG_META: Record<string, { label: string; description: string; color: string }> = {
  NEW:       { label: "NEW ARRIVALS",    description: "The latest additions — fresh off the production line.",        color: "#22c55e"  },
  HOT:       { label: "HOT RIGHT NOW",   description: "Trending pieces flying off the shelves.",                      color: "#e5202e"  },
  LIMITED:   { label: "LIMITED EDITION", description: "Exclusive drops in limited quantities. Once gone, they're gone.", color: "#eab308" },
  EXCLUSIVE: { label: "EXCLUSIVE",       description: "Members-only pieces you won't find anywhere else.",             color: "#8b5cf6"  },
  SALE:      { label: "SALE",            description: "Best prices on premium performance gear.",                     color: "#3b82f6"  },
  BESTSELLER:{ label: "BESTSELLERS",     description: "Our most loved products, chosen by the community.",             color: "#f97316"  },
}

const OTHER_TAGS = ["NEW","HOT","LIMITED","EXCLUSIVE","SALE","BESTSELLER"]

function safeImg(url?: string) {
  return url && url.startsWith("http") ? url : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"
}

function trackRecentlyViewed(p: Product) {
  try {
    const key = "trident_recently_viewed"
    const existing: RecentItem[] = JSON.parse(localStorage.getItem(key) || "[]")
    const filtered = existing.filter(r => r._id !== p._id)
    const updated = [{ _id: p._id, name: p.name, price: p.price, image: p.image }, ...filtered].slice(0, 12)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {}
}

export default function TagCollectionPage() {
  const params = useParams()
  const router = useRouter()
  const { fmt } = useCurrency()
  const tag = (Array.isArray(params.tag) ? params.tag[0] : params.tag || "NEW").toUpperCase()
  const meta = TAG_META[tag] || { label: tag, description: "Products tagged with " + tag, color: "#e5202e" }

  const [products,       setProducts]       = useState<Product[]>([])
  const [loading,        setLoading]        = useState(true)
  const [sort,           setSort]           = useState("newest")
  const [recentlyViewed, setRecentlyViewed] = useState<RecentItem[]>([])

  useEffect(() => {
    try {
      const items: RecentItem[] = JSON.parse(localStorage.getItem("trident_recently_viewed") || "[]")
      setRecentlyViewed(items.slice(0, 6))
    } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    setProducts([])
    fetch(`/api/products?tag=${encodeURIComponent(tag)}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setProducts(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tag])

  const sorted = [...products].sort((a, b) => {
    if (sort === "price_asc")  return a.price - b.price
    if (sort === "price_desc") return b.price - a.price
    return 0 // newest = default from API
  })

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: 64, background: "rgba(10,10,10,0.97)", borderBottom: "1px solid #1e1e1e" }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>TRIDENT</Link>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {OTHER_TAGS.map(t => (
            <Link key={t} href={`/collection/tag/${t}`}
              style={{ fontSize: ".72rem", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none", color: t === tag ? meta.color : "#555", borderBottom: t === tag ? `2px solid ${meta.color}` : "2px solid transparent", paddingBottom: "2px", transition: "color .2s" }}>
              {t}
            </Link>
          ))}
        </div>
        <Link href="/collection/men" style={{ color: "#666", fontSize: ".78rem", fontWeight: 700, letterSpacing: 1, textDecoration: "none" }}>ALL →</Link>
      </nav>

      {/* Hero banner */}
      <div style={{ background: `linear-gradient(135deg, #0a0a0a 0%, rgba(10,10,10,0.8) 100%)`, borderBottom: "1px solid #1e1e1e", padding: "4rem 2.5rem 3rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: meta.color, color: "#000", fontSize: ".65rem", fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", padding: ".35rem .85rem", marginBottom: "1rem" }}>
            {tag}
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(3rem,8vw,6rem)", letterSpacing: 2, lineHeight: .9, marginBottom: "1rem" }}>
            {meta.label}
          </h1>
          <p style={{ color: "#666", fontSize: ".92rem", maxWidth: 460, lineHeight: 1.65 }}>{meta.description}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "1.5rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ color: "#555", fontSize: ".82rem", fontWeight: 700 }}>
          {loading ? "Loading…" : `${sorted.length} product${sorted.length !== 1 ? "s" : ""}`}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".55rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".82rem", outline: "none", appearance: "none" }}>
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2.5rem 5rem" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1.5px", background: "#1e1e1e" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: "#0d0d0d", height: 380 }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "6rem 2rem", border: "1px solid #1e1e1e" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏷️</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 2, color: "#555", marginBottom: ".75rem" }}>
              NO {tag} PRODUCTS YET
            </div>
            <p style={{ color: "#444", fontSize: ".85rem", marginBottom: "1.5rem" }}>Check back soon — new drops coming.</p>
            <Link href="/collection/men" style={{ display: "inline-block", background: "#e5202e", color: "#fff", padding: ".75rem 2.5rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
              EXPLORE ALL →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1.5px", background: "#1e1e1e" }}>
            {sorted.map(p => {
              const fp = p.couponDiscount ? +(p.price * (1 - p.couponDiscount / 100)).toFixed(2) : p.price
              const sold = p.stockStatus === "sold_out"
              const soon = p.stockStatus === "coming_soon"
              return (
                <div key={p._id} onClick={() => { trackRecentlyViewed(p); router.push(`/product/${p._id}`) }}
                  style={{ background: "#0d0d0d", overflow: "hidden", cursor: "pointer" }}>
                  <div style={{ position: "relative", height: 300, background: "#111", overflow: "hidden" }}>
                    <Image src={safeImg(p.image)} alt={p.name} fill style={{ objectFit: "cover", transition: "transform .4s" }} unoptimized
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1.05)")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")} />
                    {(sold || soon) && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", letterSpacing: 2, color: sold ? "#e5202e" : "#eab308" }}>
                          {sold ? "SOLD OUT" : "COMING SOON"}
                        </span>
                      </div>
                    )}
                    {p.stockStatus === "active" && typeof p.stockQuantity === "number" && p.stockQuantity > 0 && p.stockQuantity <= 5 && (
                      <span style={{ position: "absolute", bottom: "1rem", left: "1rem", background: "rgba(234,179,8,.9)", color: "#000", fontSize: ".62rem", fontWeight: 900, letterSpacing: 1, padding: ".25rem .6rem", textTransform: "uppercase" }}>
                        Only {p.stockQuantity} left!
                      </span>
                    )}
                    <span style={{ position: "absolute", top: "1rem", left: "1rem", background: meta.color, color: "#000", fontSize: ".6rem", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", padding: ".25rem .6rem" }}>{p.tag}</span>
                  </div>
                  <div style={{ padding: "1rem 1.2rem" }}>
                    <div style={{ fontSize: ".65rem", color: "#555", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: ".25rem" }}>{p.category}</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: ".4rem" }}>{p.name}</div>
                    <div style={{ fontWeight: 800, color: "#f5f5f5" }}>{fmt(fp)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div style={{ borderTop: "1px solid #1a1a1a", padding: "3rem 2.5rem", maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 3, marginBottom: "1.5rem" }}>
            RECENTLY VIEWED
          </div>
          <div style={{ display: "flex", gap: "1px", background: "#1a1a1a", overflowX: "auto" }}>
            {recentlyViewed.map(rv => (
              <div key={rv._id} onClick={() => router.push(`/product/${rv._id}`)}
                style={{ background: "#0a0a0a", cursor: "pointer", minWidth: 160, flexShrink: 0, overflow: "hidden" }}>
                <div style={{ position: "relative", height: 200, background: "#0d0d0d" }}>
                  <Image src={safeImg(rv.image)} alt={rv.name} fill style={{ objectFit: "cover" }} unoptimized />
                </div>
                <div style={{ padding: ".75rem 1rem" }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 700, marginBottom: ".2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rv.name}</div>
                  <div style={{ fontWeight: 800, fontSize: ".85rem", color: "#e5202e" }}>{fmt(rv.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
