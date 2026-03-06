"use client"

import { useEffect, useState, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Product = {
  _id: string; name: string; price: number; image?: string; tag?: string
  category?: string; sizes?: string[]; stockStatus?: "active" | "sold_out" | "coming_soon"
}

// Maps URL slugs → DB category keyword
const SLUG_TO_CATEGORY: Record<string, string> = {
  "tshirts":    "T-Shirts",
  "shirts":     "Shirts",
  "polo-shirts":"Polo Shirts",
  "hoodies":    "Hoodies",
  "jackets":    "Jackets",
  "shorts":     "Shorts",
  "shoes":      "Shoes",
  "tracksuits": "Tracksuits",
  "accessories":"Accessories",
  "crop-tops":  "Crop Tops",
  "sports-bra": "Sports Bra",
  "dresses":    "Dresses",
  "yoga-pants": "Yoga Pants",
  "activewear": "Activewear",
  "clothing":   "Clothing",
}

function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:"))
    ? url
    : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"
}

export default function SubcategoryPage({ params }: { params: Promise<{ gender: string; subcategory: string }> }) {
  const { gender, subcategory } = use(params)
  const router   = useRouter()
  const catLabel = SLUG_TO_CATEGORY[subcategory] || subcategory.replace(/-/g, " ")
  const genderLabel = gender.charAt(0).toUpperCase() + gender.slice(1)
  const categoryQuery = `${genderLabel} — ${catLabel}`

  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [sort,     setSort]     = useState("newest")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/products?category=${encodeURIComponent(categoryQuery)}`)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [categoryQuery])

  const sorted = [...products].sort((a, b) => {
    if (sort === "price-asc")  return a.price - b.price
    if (sort === "price-desc") return b.price - a.price
    return 0
  })

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: 60, background: "rgba(10,10,10,0.95)", borderBottom: "1px solid #1e1e1e", backdropFilter: "blur(8px)" }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>
          TRI<span style={{ color: "#e5202e" }}>DENT</span>
        </Link>
        <div style={{ display: "flex", gap: "2rem" }}>
          {["men","women","kids","unisex"].map(g => (
            <Link key={g} href={`/collection/${g}`}
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".85rem", letterSpacing: 3, textTransform: "uppercase", color: g === gender.toLowerCase() ? "#f5f5f5" : "#444", textDecoration: "none", borderBottom: g === gender.toLowerCase() ? "2px solid #e5202e" : "2px solid transparent", paddingBottom: 2 }}>
              {g}
            </Link>
          ))}
        </div>
        <Link href="/account" style={{ color: "#666", fontSize: ".78rem", fontWeight: 700, letterSpacing: 1, textDecoration: "none" }}>ACCOUNT</Link>
      </nav>

      {/* Breadcrumb + heading */}
      <div style={{ marginTop: 60, padding: "3rem 2.5rem 2rem" }}>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "#444", fontSize: ".72rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none" }}>Home</Link>
          <span style={{ color: "#333" }}>/</span>
          <Link href={`/collection/${gender}`} style={{ color: "#444", fontSize: ".72rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none" }}>{genderLabel}</Link>
          <span style={{ color: "#333" }}>/</span>
          <span style={{ color: "#888", fontSize: ".72rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>{catLabel}</span>
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3.5rem", letterSpacing: 3, marginBottom: 0 }}>
          {genderLabel.toUpperCase()}&apos;S <span style={{ color: "#e5202e" }}>{catLabel.toUpperCase()}</span>
        </h1>
        <div style={{ color: "#444", fontSize: ".78rem", fontWeight: 700, letterSpacing: 2, marginTop: ".5rem" }}>
          {sorted.length} PRODUCTS
        </div>
      </div>

      {/* Sort toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 2.5rem 1.5rem" }}>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#888", padding: ".45rem .9rem", fontFamily: "'Barlow', sans-serif", fontSize: ".78rem", fontWeight: 700, outline: "none", appearance: "none" }}>
          <option value="newest">NEWEST</option>
          <option value="price-asc">PRICE: LOW TO HIGH</option>
          <option value="price-desc">PRICE: HIGH TO LOW</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{ padding: "0 2.5rem 4rem" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 1, background: "#1a1a1a" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "#0d0d0d", height: 360 }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👟</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 2, marginBottom: ".5rem" }}>NO PRODUCTS HERE YET</div>
            <p style={{ color: "#555", fontSize: ".88rem", marginBottom: "1.5rem" }}>
              We&apos;re working on restocking {catLabel} for {genderLabel}. Check back soon!
            </p>
            <Link href={`/collection/${gender}`}
              style={{ display: "inline-block", background: "#e5202e", color: "#fff", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
              VIEW ALL {genderLabel.toUpperCase()}
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 1, background: "#1a1a1a" }}>
            {sorted.map(p => (
              <div key={p._id} onClick={() => router.push(`/product/${p._id}`)}
                style={{ background: "#0a0a0a", cursor: "pointer", overflow: "hidden" }}>
                <div style={{ position: "relative", aspectRatio: "4/5", background: "#0d0d0d" }}>
                  <Image src={safeImg(p.image)} alt={p.name} fill style={{ objectFit: "cover" }} unoptimized />
                  {p.tag && (
                    <span style={{ position: "absolute", top: "1rem", left: "1rem", background: "#e5202e", color: "#fff", fontSize: ".62rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: ".25rem .6rem" }}>{p.tag}</span>
                  )}
                  {p.stockStatus !== "active" && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 3, color: p.stockStatus === "sold_out" ? "#e5202e" : "#eab308" }}>
                        {p.stockStatus === "sold_out" ? "SOLD OUT" : "COMING SOON"}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ padding: "1rem 1.2rem" }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: ".3rem" }}>{p.name}</div>
                  <div style={{ fontWeight: 800 }}>${p.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
