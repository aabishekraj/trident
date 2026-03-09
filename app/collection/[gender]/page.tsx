"use client"

import { useEffect, useState, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Product = {
  _id: string; name: string; price: number; image?: string; tag?: string
  category?: string; sizes?: string[]; stockStatus?: "active" | "sold_out" | "coming_soon"
}

const GENDER_META: Record<string, { label: string; hero: string; sub: { label: string; slug: string }[] }> = {
  men: {
    label: "MEN",
    hero: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1600&q=80",
    sub: [
      { label: "T-Shirts",    slug: "tshirts"    },
      { label: "Shirts",      slug: "shirts"     },
      { label: "Polo Shirts", slug: "polo-shirts"},
      { label: "Hoodies",     slug: "hoodies"    },
      { label: "Jackets",     slug: "jackets"    },
      { label: "Shorts",      slug: "shorts"     },
      { label: "Shoes",       slug: "shoes"      },
      { label: "Tracksuits",  slug: "tracksuits" },
      { label: "Accessories", slug: "accessories"},
    ],
  },
  women: {
    label: "WOMEN",
    hero: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&q=80",
    sub: [
      { label: "T-Shirts",    slug: "tshirts"    },
      { label: "Crop Tops",   slug: "crop-tops"  },
      { label: "Sports Bra",  slug: "sports-bra" },
      { label: "Dresses",     slug: "dresses"    },
      { label: "Yoga Pants",  slug: "yoga-pants" },
      { label: "Shorts",      slug: "shorts"     },
      { label: "Shoes",       slug: "shoes"      },
      { label: "Jackets",     slug: "jackets"    },
      { label: "Activewear",  slug: "activewear" },
      { label: "Accessories", slug: "accessories"},
    ],
  },
  kids: {
    label: "KIDS",
    hero: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1600&q=80",
    sub: [
      { label: "Clothing",    slug: "clothing"   },
      { label: "Shoes",       slug: "shoes"      },
      { label: "Accessories", slug: "accessories"},
    ],
  },
  unisex: {
    label: "UNISEX",
    hero: "https://images.unsplash.com/photo-1529720317453-c8da503f2051?w=1600&q=80",
    sub: [],
  },
}

function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:"))
    ? url
    : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"
}

export default function GenderCollectionPage({ params }: { params: Promise<{ gender: string }> }) {
  const { gender } = use(params)
  const router   = useRouter()
  const meta     = GENDER_META[gender.toLowerCase()] || GENDER_META["men"]

  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [sort,     setSort]     = useState("newest")
  const [filter,   setFilter]   = useState("")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/products?category=${encodeURIComponent(meta.label === "UNISEX" ? "Unisex" : meta.label.charAt(0) + meta.label.slice(1).toLowerCase())}`)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [gender, meta.label])

  const sorted = [...products].filter(p =>
    !filter || p.category?.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => {
    if (sort === "price-asc")  return a.price - b.price
    if (sort === "price-desc") return b.price - a.price
    return 0 // newest = default API order
  })

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>

      {/* Minimal nav */}
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: 60, background: "rgba(10,10,10,0.95)", borderBottom: "1px solid #1e1e1e", backdropFilter: "blur(8px)" }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>
          TRI<span style={{ color: "#e5202e" }}>DENT</span>
        </Link>
        <div style={{ display: "flex", gap: "2rem" }}>
          {["men","women","kids","unisex"].map(g => (
            <Link key={g} href={`/collection/${g}`}
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".85rem", letterSpacing: 3, textTransform: "uppercase", color: g === gender.toLowerCase() ? "#f5f5f5" : "#444", textDecoration: "none", borderBottom: g === gender.toLowerCase() ? "2px solid #e5202e" : "2px solid transparent", paddingBottom: 2, transition: "color .2s" }}>
              {g}
            </Link>
          ))}
        </div>
        <Link href="/account" style={{ color: "#666", fontSize: ".78rem", fontWeight: 700, letterSpacing: 1, textDecoration: "none" }}>ACCOUNT</Link>
      </nav>

      {/* Hero */}
      <div style={{ position: "relative", height: 380, marginTop: 60, overflow: "hidden" }}>
        <Image src={meta.hero} alt={meta.label} fill style={{ objectFit: "cover", opacity: 0.35 }} unoptimized />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, #0a0a0a 100%)" }} />
        <div style={{ position: "absolute", bottom: "2.5rem", left: "2.5rem" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "5rem", letterSpacing: 4, lineHeight: 1 }}>{meta.label}</div>
          <div style={{ color: "#555", fontSize: ".85rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginTop: ".5rem" }}>
            {products.length || "…"} products
          </div>
        </div>
      </div>

      {/* Sub-category tabs */}
      {meta.sub.length > 0 && (
        <div style={{ borderBottom: "1px solid #1e1e1e", overflowX: "auto", display: "flex", gap: 0 }}>
          <button onClick={() => setFilter("")}
            style={{ flexShrink: 0, padding: "1rem 1.5rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".82rem", letterSpacing: 2, textTransform: "uppercase", background: "none", border: "none", color: !filter ? "#f5f5f5" : "#444", borderBottom: !filter ? "2px solid #e5202e" : "2px solid transparent", cursor: "pointer", transition: "color .2s" }}>
            ALL
          </button>
          {meta.sub.map(s => (
            <button key={s.slug} onClick={() => setFilter(s.label)}
              style={{ flexShrink: 0, padding: "1rem 1.5rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".82rem", letterSpacing: 2, textTransform: "uppercase", background: "none", border: "none", color: filter === s.label ? "#f5f5f5" : "#444", borderBottom: filter === s.label ? "2px solid #e5202e" : "2px solid transparent", cursor: "pointer", transition: "color .2s" }}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2.5rem", borderBottom: "1px solid #111" }}>
        <div style={{ color: "#444", fontSize: ".8rem", fontWeight: 700, letterSpacing: 1.5 }}>
          {sorted.length} RESULTS
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#888", padding: ".45rem .9rem", fontFamily: "'Barlow', sans-serif", fontSize: ".78rem", fontWeight: 700, outline: "none", appearance: "none" }}>
          <option value="newest">NEWEST</option>
          <option value="price-asc">PRICE: LOW TO HIGH</option>
          <option value="price-desc">PRICE: HIGH TO LOW</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{ padding: "2rem 2.5rem" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 1, background: "#1a1a1a" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: "#0d0d0d", height: 380, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "6rem 2rem", color: "#333" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👟</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 2 }}>NO PRODUCTS YET</div>
            <p style={{ color: "#444", fontSize: ".85rem", marginTop: ".5rem" }}>Check back soon or explore other categories.</p>
            <Link href="/" style={{ display: "inline-block", marginTop: "1.5rem", background: "#e5202e", color: "#fff", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
              BACK TO HOME
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 1, background: "#1a1a1a" }}>
            {sorted.map(p => (
              <div key={p._id} onClick={() => router.push(`/product/${p._id}`)}
                style={{ background: "#0a0a0a", cursor: "pointer", overflow: "hidden", transition: "transform .2s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "")}>
                <div style={{ position: "relative", aspectRatio: "4/5", background: "#0d0d0d" }}>
                  <Image src={safeImg(p.image)} alt={p.name} fill style={{ objectFit: "cover", transition: "transform .4s" }} unoptimized
                    onMouseEnter={e => ((e.target as HTMLElement).style.transform = "scale(1.04)")}
                    onMouseLeave={e => ((e.target as HTMLElement).style.transform = "")} />
                  {p.tag && (
                    <span style={{ position: "absolute", top: "1rem", left: "1rem", background: "#e5202e", color: "#fff", fontSize: ".62rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: ".25rem .6rem" }}>{p.tag}</span>
                  )}
                  {p.stockStatus === "sold_out" && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 3, color: "#e5202e" }}>SOLD OUT</span>
                    </div>
                  )}
                  {p.stockStatus === "coming_soon" && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 3, color: "#eab308" }}>COMING SOON</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: "1rem 1.2rem" }}>
                  <div style={{ fontSize: ".65rem", color: "#444", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: ".25rem" }}>{p.category}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: ".4rem" }}>{p.name}</div>
                  <div style={{ fontWeight: 800, color: "#f5f5f5" }}>${p.price}</div>
                  {p.sizes && p.sizes.length > 0 && (
                    <div style={{ display: "flex", gap: ".25rem", flexWrap: "wrap", marginTop: ".5rem" }}>
                      {p.sizes.slice(0, 4).map(s => (
                        <span key={s} style={{ border: "1px solid #1e1e1e", color: "#444", fontSize: ".6rem", fontWeight: 700, padding: ".1rem .35rem" }}>{s}</span>
                      ))}
                      {p.sizes.length > 4 && <span style={{ color: "#444", fontSize: ".6rem" }}>+{p.sizes.length - 4}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
