"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { useCurrency } from "@/context/CurrencyContext"
import RecentlyViewed from "@/components/RecentlyViewed"

type Product = {
  _id: string; name: string; price: number; description: string
  category: string; tag?: string; sizes: string[]; colors: string[]
  image: string; images: string[]
  stockStatus: "active" | "sold_out" | "coming_soon"
  stockQuantity: number
  couponDiscount?: number; avgRating?: number; reviewCount?: number
}

type Review = {
  _id: string; customerName: string; rating: number; title: string
  body: string; verified: boolean; createdAt: string
}

const COLOR_MAP: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f5", red: "#e5202e", blue: "#3b82f6",
  green: "#22c55e", yellow: "#eab308", purple: "#8b5cf6", gray: "#888",
  grey: "#888", navy: "#1e3a5f", olive: "#6b7c43", brown: "#8b5e3c",
  orange: "#f97316", pink: "#ec4899", teal: "#14b8a6", maroon: "#800020",
}

function colorHex(name: string) { return COLOR_MAP[name.toLowerCase()] || "#555" }

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? "#eab308" : "#333", fontSize: size }}>★</span>
      ))}
    </span>
  )
}

function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:"))
    ? url : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"
}

function getCustomer() {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem("trident_customer") || "null") } catch { return null }
}

export default function ProductPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { addToCart } = useCart()
  const { fmt, shippingFreeThreshold } = useCurrency()

  const [product, setProduct]       = useState<Product | null>(null)
  const [mainImg, setMainImg]       = useState("")
  const [selSize, setSelSize]       = useState("")
  const [selColor, setSelColor]     = useState("")
  const [added, setAdded]           = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [loading, setLoading]       = useState(true)

  const [reviews, setReviews]       = useState<Review[]>([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" })
  const [submitting, setSubmitting] = useState(false)
  const [reviewMsg, setReviewMsg]   = useState("")

  const [imgZoom, setImgZoom]       = useState(false)

  const customer = getCustomer()

  const loadProduct = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      const p: Product = Array.isArray(data) ? data.find((x: Product) => x._id === id) : null
      if (p) {
        setProduct(p)
        const allImgs = [p.image, ...(p.images || [])].filter(Boolean)
        setMainImg(allImgs[0] || "")
        if (p.sizes?.length) setSelSize(p.sizes[0])
        if (p.colors?.length) setSelColor(p.colors[0])
        try {
          const rv = JSON.parse(localStorage.getItem("trident_recently_viewed") || "[]") as string[]
          const updated = [p._id, ...rv.filter((x: string) => x !== p._id)].slice(0, 8)
          localStorage.setItem("trident_recently_viewed", JSON.stringify(updated))
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [id])

  const loadReviews = useCallback(async () => {
    try {
      const r = await fetch(`/api/reviews?productId=${id}`)
      const j = await r.json()
      if (j.success) setReviews(j.data)
    } catch { /* ignore */ }
  }, [id])

  useEffect(() => { loadProduct(); loadReviews() }, [loadProduct, loadReviews])

  useEffect(() => {
    if (!customer) {
      const wl: Array<{ _id: string }> = JSON.parse(localStorage.getItem("trident_wishlist") || "[]")
      setWishlisted(wl.some(i => i._id === id))
    } else {
      fetch("/api/wishlist", { headers: { "x-customer-email": customer.email } })
        .then(r => r.json())
        .then(j => { if (j.success) setWishlisted(j.productIds.includes(id)) })
        .catch(() => {})
    }
  }, [id, customer?.email])  // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleWishlist() {
    if (!product) return
    if (!customer) {
      const wl: Product[] = JSON.parse(localStorage.getItem("trident_wishlist") || "[]")
      if (wishlisted) {
        localStorage.setItem("trident_wishlist", JSON.stringify(wl.filter(i => i._id !== id)))
      } else {
        wl.push(product)
        localStorage.setItem("trident_wishlist", JSON.stringify(wl))
      }
      setWishlisted(!wishlisted)
      return
    }
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-customer-email": customer.email },
      body: JSON.stringify({ productId: id, action: wishlisted ? "remove" : "add" }),
    })
    setWishlisted(!wishlisted)
  }

  function handleAddToCart() {
    if (!product || product.stockStatus !== "active") return
    const finalP = product.couponDiscount
      ? +(product.price * (1 - product.couponDiscount / 100)).toFixed(2)
      : product.price
    addToCart({
      id:             product._id,
      name:           product.name,
      price:          finalP,
      image:          product.image,
      size:           selSize || undefined,
      couponDiscount: product.couponDiscount,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  async function submitReview() {
    if (!customer) { router.push("/signin"); return }
    if (!reviewForm.body.trim()) return
    setSubmitting(true)
    setReviewMsg("")
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reviewForm, productId: id, customerEmail: customer.email, customerName: customer.name }),
      })
      const j = await r.json()
      if (j.success) {
        setReviewMsg("Review submitted — thank you!")
        setReviewForm({ rating: 5, title: "", body: "" })
        loadReviews()
        loadProduct()
      } else setReviewMsg(j.error || "Failed to submit.")
    } catch { setReviewMsg("Error submitting review.") }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontFamily: "'Barlow', sans-serif" }}>Loading…</div>
  )
  if (!product) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", fontFamily: "'Barlow', sans-serif" }}>
      <div style={{ color: "#555" }}>Product not found.</div>
      <Link href="/" style={{ color: "#e5202e", fontSize: ".85rem" }}>← Back to Home</Link>
    </div>
  )

  const allImgs = [product.image, ...(product.images || [])].filter(Boolean)
  const finalP  = product.couponDiscount ? +(product.price * (1 - product.couponDiscount / 100)).toFixed(2) : product.price
  const sold    = product.stockStatus === "sold_out"
  const soon    = product.stockStatus === "coming_soon"
  const low     = product.stockStatus === "active" && product.stockQuantity > 0 && product.stockQuantity <= 5

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "1.5rem 2rem .5rem", fontSize: ".72rem", color: "#555", display: "flex", gap: ".5rem", alignItems: "center" }}>
        <Link href="/" style={{ color: "#555", textDecoration: "none" }}>Home</Link>
        <span>/</span>
        <span style={{ color: "#888", textTransform: "capitalize" }}>{product.category}</span>
        <span>/</span>
        <span style={{ color: "#888" }}>{product.name}</span>
      </div>

      {/* Main grid */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "1rem 2rem 4rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }}>

        {/* LEFT — Gallery */}
        <div>
          <div onClick={() => setImgZoom(true)} style={{ position: "relative", background: "#111", aspectRatio: "4/5", overflow: "hidden", cursor: "zoom-in", marginBottom: "1px" }}>
            <Image src={safeImg(mainImg)} alt={product.name} fill style={{ objectFit: "cover", transition: "transform .5s" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1.04)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
              unoptimized />
            {(sold || soon) && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: 3, color: sold ? "#e5202e" : "#eab308" }}>
                  {sold ? "SOLD OUT" : "COMING SOON"}
                </span>
              </div>
            )}
            {product.couponDiscount ? (
              <div style={{ position: "absolute", top: "1rem", left: "1rem", background: "#e5202e", color: "#fff", fontSize: ".6rem", fontWeight: 900, letterSpacing: 2, padding: ".25rem .65rem" }}>
                -{product.couponDiscount}% OFF
              </div>
            ) : null}
            {low && (
              <div style={{ position: "absolute", bottom: "1rem", left: "1rem", background: "#eab308", color: "#000", fontSize: ".65rem", fontWeight: 900, letterSpacing: 1.5, padding: ".3rem .75rem" }}>
                ONLY {product.stockQuantity} LEFT
              </div>
            )}
          </div>
          {allImgs.length > 1 && (
            <div style={{ display: "flex", gap: "1px", background: "#1e1e1e" }}>
              {allImgs.map((img, i) => (
                <div key={i} onClick={() => setMainImg(img)}
                  style={{ flex: 1, aspectRatio: "1/1", position: "relative", background: "#0d0d0d", cursor: "pointer", outline: mainImg === img ? "2px solid #e5202e" : "none", outlineOffset: "-2px", overflow: "hidden" }}>
                  <Image src={safeImg(img)} alt={`view ${i+1}`} fill style={{ objectFit: "cover" }} unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Info */}
        <div style={{ paddingTop: ".5rem" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".75rem" }}>{product.category}</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem,4vw,3rem)", letterSpacing: 1, lineHeight: .95, marginBottom: "1rem" }}>{product.name}</h1>

          {(product.reviewCount ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem" }}>
              <Stars rating={product.avgRating || 0} />
              <span style={{ fontSize: ".78rem", color: "#666" }}>{product.avgRating?.toFixed(1)} ({product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""})</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "baseline", gap: ".75rem", marginBottom: "1.5rem" }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 1 }}>{fmt(finalP)}</span>
            {product.couponDiscount ? <span style={{ color: "#555", fontSize: "1rem", textDecoration: "line-through" }}>{fmt(product.price)}</span> : null}
          </div>

          <p style={{ color: "#888", fontSize: ".88rem", lineHeight: 1.75, marginBottom: "1.75rem", maxWidth: 420 }}>
            {product.description || "Built for movement and performance. Precision-engineered for comfort, durability, and style."}
          </p>

          {product.colors?.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".6rem" }}>
                Color — <span style={{ color: "#f5f5f5", textTransform: "capitalize" }}>{selColor}</span>
              </div>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {product.colors.map(c => (
                  <button key={c} onClick={() => setSelColor(c)} title={c}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: colorHex(c), border: selColor === c ? "2px solid #f5f5f5" : "2px solid #1e1e1e", outline: selColor === c ? "2px solid #e5202e" : "none", outlineOffset: 2, cursor: "pointer" }} />
                ))}
              </div>
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".6rem" }}>
                <span style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555" }}>Size — <span style={{ color: "#f5f5f5" }}>{selSize}</span></span>
                <Link href="/size-guide" style={{ fontSize: ".65rem", color: "#e5202e", textDecoration: "none", fontWeight: 700, letterSpacing: 1 }}>SIZE GUIDE →</Link>
              </div>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelSize(s)}
                    style={{ width: 44, height: 44, border: selSize === s ? "2px solid #f5f5f5" : "1px solid #1e1e1e", background: selSize === s ? "#f5f5f5" : "transparent", color: selSize === s ? "#0a0a0a" : "#888", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".78rem", cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem" }}>
            <button onClick={handleAddToCart} disabled={sold || soon}
              style={{ flex: 1, background: sold || soon ? "#1a1a1a" : added ? "#22c55e" : "#e5202e", color: sold || soon ? "#444" : "#fff", border: "none", padding: "1rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase", cursor: sold || soon ? "not-allowed" : "pointer", transition: "background .2s" }}>
              {sold ? "SOLD OUT" : soon ? "COMING SOON" : added ? "✓ ADDED!" : "ADD TO BAG"}
            </button>
            <button onClick={toggleWishlist}
              style={{ width: 52, height: 52, border: `1px solid ${wishlisted ? "#e5202e" : "#1e1e1e"}`, background: wishlisted ? "rgba(229,32,46,.12)" : "transparent", color: wishlisted ? "#e5202e" : "#555", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {wishlisted ? "♥" : "♡"}
            </button>
          </div>

          {low && (
            <div style={{ background: "rgba(234,179,8,.1)", border: "1px solid rgba(234,179,8,.3)", padding: ".6rem 1rem", fontSize: ".75rem", color: "#eab308", fontWeight: 700, letterSpacing: 1, marginBottom: "1rem" }}>
              ⚡ Only {product.stockQuantity} units left — order soon!
            </div>
          )}

          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "1rem", marginTop: ".5rem", display: "flex", flexDirection: "column", gap: ".4rem" }}>
            <div style={{ fontSize: ".72rem", color: "#444" }}>🚚 Free shipping on orders over {fmt(shippingFreeThreshold)}</div>
            <div style={{ fontSize: ".72rem", color: "#444" }}>↩ 30-day hassle-free returns</div>
            <div style={{ fontSize: ".72rem", color: "#444" }}>✓ Secure checkout with Stripe</div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem 5rem", borderTop: "1px solid #1a1a1a" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 2, paddingTop: "2.5rem", marginBottom: "2rem" }}>
          CUSTOMER REVIEWS <span style={{ color: "#e5202e" }}>({reviews.length})</span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: reviews.length > 0 ? "1fr 1fr" : "1fr", gap: "3rem" }}>
          {reviews.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {reviews.map(r => (
                <div key={r._id} style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: ".5rem" }}>
                    <Stars rating={r.rating} />
                    {r.verified && <span style={{ fontSize: ".6rem", background: "rgba(34,197,94,.1)", color: "#22c55e", padding: ".2rem .5rem", fontWeight: 700, letterSpacing: 1 }}>✓ VERIFIED PURCHASE</span>}
                  </div>
                  {r.title && <div style={{ fontWeight: 700, fontSize: ".88rem", marginBottom: ".35rem" }}>{r.title}</div>}
                  <p style={{ color: "#888", fontSize: ".82rem", lineHeight: 1.65, marginBottom: ".75rem" }}>{r.body}</p>
                  <div style={{ fontSize: ".65rem", color: "#444" }}>{r.customerName} · {new Date(r.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
              ))}
            </div>
          )}

          <div>
            <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "1rem" }}>
              {customer ? "Write a Review" : "Sign In to Write a Review"}
            </div>
            {customer ? (
              <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: ".65rem", color: "#555", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: ".4rem" }}>Rating</div>
                  <div style={{ display: "flex", gap: ".25rem" }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                        style={{ background: "none", border: "none", fontSize: "1.5rem", color: n <= reviewForm.rating ? "#eab308" : "#333", cursor: "pointer", padding: 0 }}>★</button>
                    ))}
                  </div>
                </div>
                <input value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} maxLength={100}
                  placeholder="Title (optional)"
                  style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".65rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".85rem", outline: "none", boxSizing: "border-box" }} />
                <textarea value={reviewForm.body} onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))} maxLength={1000} rows={4}
                  placeholder="Share your honest experience…"
                  style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".65rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".85rem", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                {reviewMsg && <div style={{ fontSize: ".78rem", color: reviewMsg.includes("thank") ? "#22c55e" : "#e5202e", fontWeight: 700 }}>{reviewMsg}</div>}
                <button onClick={submitReview} disabled={submitting || !reviewForm.body.trim()}
                  style={{ background: !reviewForm.body.trim() ? "#111" : "#e5202e", color: !reviewForm.body.trim() ? "#333" : "#fff", border: "none", padding: ".8rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", cursor: !reviewForm.body.trim() ? "not-allowed" : "pointer" }}>
                  {submitting ? "SUBMITTING…" : "SUBMIT REVIEW"}
                </button>
              </div>
            ) : (
              <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "2rem", textAlign: "center" }}>
                <div style={{ color: "#555", fontSize: ".85rem", marginBottom: "1rem" }}>Sign in to share your experience.</div>
                <Link href={`/signin?redirect=/product/${id}`}
                  style={{ display: "inline-block", background: "#e5202e", color: "#fff", padding: ".65rem 2rem", fontWeight: 800, fontSize: ".75rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
                  SIGN IN TO REVIEW
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recently viewed */}
      <RecentlyViewed exclude={id} />

      {/* Image zoom */}
      {imgZoom && (
        <div onClick={() => setImgZoom(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <div style={{ position: "relative", width: "min(90vw,800px)", height: "min(90vh,1000px)" }}>
            <Image src={safeImg(mainImg)} alt={product.name} fill style={{ objectFit: "contain" }} unoptimized />
          </div>
          <button onClick={() => setImgZoom(false)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "#888", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  )
}
