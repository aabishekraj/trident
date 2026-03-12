"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { useCurrency } from "@/context/CurrencyContext"

type Product = {
  _id: string; name: string; price: number; image?: string
  category?: string; tag?: string; stockStatus?: string
  couponDiscount?: number; avgRating?: number; reviewCount?: number
}

function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:"))
    ? url : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"
}

function Stars({ rating }: { rating: number }) {
  return (
    <span>{[1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= Math.round(rating) ? "#eab308" : "#333", fontSize: 11 }}>★</span>
    ))}</span>
  )
}

function SearchContent() {
  const params  = useSearchParams()
  const router  = useRouter()
  const { addToCart } = useCart()
  const { fmt } = useCurrency()

  const [query,    setQuery]    = useState(params.get("q") || "")
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(false)
  const [sort,     setSort]     = useState("newest")

  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const q = params.get("q") || ""
    setQuery(q)
    if (q.trim().length >= 2) doSearch(q)
    else setProducts([])
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps

  function doSearch(q: string) {
    setLoading(true)
    fetch(`/api/products?search=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }

  function handleInput(val: string) {
    setQuery(val)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      if (val.trim().length >= 2) {
        router.replace(`/search?q=${encodeURIComponent(val.trim())}`, { scroll: false })
      } else {
        setProducts([])
      }
    }, 350)
  }

  const sorted = [...products].sort((a, b) => {
    if (sort === "price_asc")  return a.price - b.price
    if (sort === "price_desc") return b.price - a.price
    if (sort === "rating")     return (b.avgRating || 0) - (a.avgRating || 0)
    return 0
  })

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>

      {/* Search header */}
      <div style={{ borderBottom: "1px solid #1e1e1e", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#555", marginBottom: "1rem" }}>
            <Link href="/" style={{ color: "#555", textDecoration: "none" }}>Home</Link> / Search
          </div>

          {/* Big search input */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "1rem", borderBottom: "2px solid #e5202e" }}>
            <span style={{ color: "#555", fontSize: "1.2rem" }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => handleInput(e.target.value)}
              placeholder="Search products, categories, styles…"
              style={{ flex: 1, background: "transparent", border: "none", color: "#f5f5f5", fontSize: "clamp(1.2rem,3vw,1.8rem)", fontFamily: "'Barlow', sans-serif", fontWeight: 700, outline: "none", padding: ".75rem 0" }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setProducts([]); router.replace("/search"); inputRef.current?.focus() }}
                style={{ background: "none", border: "none", color: "#555", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            )}
          </div>

          {/* Quick categories */}
          <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem", flexWrap: "wrap" }}>
            {["T-Shirts", "Hoodies", "Shorts", "Joggers", "Jackets", "Footwear"].map(c => (
              <button key={c} onClick={() => handleInput(c)}
                style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#555", padding: ".3rem .8rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".65rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#555" }}>Searching…</div>
        ) : query.length >= 2 && sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#555" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2, marginBottom: ".75rem" }}>NO RESULTS FOR &ldquo;{query}&rdquo;</div>
            <p style={{ fontSize: ".88rem", marginBottom: "1.5rem" }}>Try a different keyword or browse a category.</p>
            <Link href="/collection/men" style={{ display: "inline-block", background: "#e5202e", color: "#fff", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>BROWSE ALL →</Link>
          </div>
        ) : sorted.length > 0 ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ color: "#555", fontSize: ".82rem", fontWeight: 700 }}>
                {sorted.length} result{sorted.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)}
                style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".82rem", outline: "none", appearance: "none" }}>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "1px", background: "#1e1e1e" }}>
              {sorted.map(p => {
                const fp   = p.couponDiscount ? +(p.price * (1 - p.couponDiscount / 100)).toFixed(2) : p.price
                const sold = p.stockStatus === "sold_out"
                return (
                  <Link key={p._id} href={`/product/${p._id}`} style={{ textDecoration: "none", color: "inherit", background: "#0d0d0d", display: "block", overflow: "hidden" }}>
                    <div style={{ position: "relative", aspectRatio: "3/4", background: "#111", overflow: "hidden" }}>
                      <Image src={safeImg(p.image)} alt={p.name} fill style={{ objectFit: "cover", transition: "transform .4s" }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1.05)")}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
                        unoptimized />
                      {sold && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: 2, color: "#e5202e" }}>SOLD OUT</span>
                        </div>
                      )}
                      {p.couponDiscount ? (
                        <span style={{ position: "absolute", top: ".75rem", left: ".75rem", background: "#e5202e", color: "#fff", fontSize: ".55rem", fontWeight: 900, letterSpacing: 1.5, padding: ".2rem .55rem" }}>-{p.couponDiscount}%</span>
                      ) : null}
                    </div>
                    <div style={{ padding: ".85rem 1rem" }}>
                      <div style={{ fontSize: ".6rem", color: "#444", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: ".2rem" }}>{p.category}</div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: ".3rem" }}>{p.name}</div>
                      {(p.reviewCount ?? 0) > 0 && (
                        <div style={{ marginBottom: ".3rem" }}><Stars rating={p.avgRating || 0} /></div>
                      )}
                      <div style={{ display: "flex", gap: ".5rem", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 800 }}>{fmt(fp)}</span>
                        {p.couponDiscount ? <span style={{ color: "#555", fontSize: ".78rem", textDecoration: "line-through" }}>{fmt(p.price)}</span> : null}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem", color: "#555" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2, marginBottom: "1rem" }}>WHAT ARE YOU LOOKING FOR?</div>
            <p style={{ fontSize: ".88rem" }}>Start typing above to search our entire collection.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
