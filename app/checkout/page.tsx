"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

type CartItem = {
  _id: string; name: string; price: number; image?: string
  qty: number; selectedSize?: string; couponDiscount?: number
}

function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:")) ? url : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=60"
}
function finalPrice(p: CartItem) {
  return p.couponDiscount ? +(p.price * (1 - p.couponDiscount / 100)).toFixed(2) : p.price
}

const INP: React.CSSProperties = {
  width: "100%", background: "#0d0d0d", border: "1px solid #1e1e1e",
  color: "#f5f5f5", padding: ".75rem 1rem",
  fontFamily: "'Barlow', sans-serif", fontSize: ".88rem", outline: "none",
}
const LABEL: React.CSSProperties = {
  display: "block", fontSize: ".7rem", fontWeight: 700,
  letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".4rem",
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart]       = useState<CartItem[]>([])
  const [step, setStep]       = useState<"details" | "payment" | "confirm">("details")
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState("")

  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", country: "India",
    cardNumber: "", cardExpiry: "", cardCvv: "", cardName: "",
    paymentMethod: "card" as "card" | "upi" | "cod",
    upiId: "",
  })

  useEffect(() => {
    const saved = sessionStorage.getItem("trident_cart")
    if (saved) setCart(JSON.parse(saved))
    // Pre-fill from customer session
    const cust = localStorage.getItem("trident_customer")
    if (cust) {
      const c = JSON.parse(cust)
      setForm(f => ({ ...f, name: c.name || "", email: c.email || "" }))
    }
  }, [])

  const subtotal  = cart.reduce((s, i) => s + finalPrice(i) * i.qty, 0)
  const shipping  = subtotal > 500 ? 0 : 49
  const tax       = +(subtotal * 0.18).toFixed(2)
  const total     = +(subtotal + shipping + tax).toFixed(2)

  function setF(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }

  async function placeOrder() {
    if (!form.name || !form.email || !form.address) return
    setPlacing(true)
    try {
      const shippingAddress = `${form.address}, ${form.city}, ${form.state} ${form.zip}, ${form.country}`

      if (form.paymentMethod === "card") {
        // Redirect to Stripe Checkout — order is pre-created server-side
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart: cart.map(i => ({ ...i, price: finalPrice(i) })),
            customer: { name: form.name, email: form.email, phone: form.phone },
            shippingAddress,
          }),
        })
        const j = await res.json()
        if (j.url) {
          sessionStorage.removeItem("trident_cart")
          window.location.href = j.url   // redirect to Stripe hosted checkout
          return
        } else {
          alert(j.error || "Payment failed. Please try again.")
        }
      } else {
        // COD or UPI — create order directly
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: { name: form.name, email: form.email, phone: form.phone, address: shippingAddress },
            items: cart.map(i => ({ productId: i._id, name: i.name, price: finalPrice(i), qty: i.qty, size: i.selectedSize })),
            totalAmount: total,
            paymentMethod: form.paymentMethod,
            paymentStatus: form.paymentMethod === "cod" ? "pending" : "pending",
            status: "pending",
          }),
        })
        const j = await res.json()
        if (j.success) {
          setOrderId(j.data.orderId)
          sessionStorage.removeItem("trident_cart")
          setStep("confirm")
        } else {
          alert(j.error || "Failed to place order.")
        }
      }
    } catch (e) {
      console.error(e)
      alert("Something went wrong. Please try again.")
    }
    setPlacing(false)
  }

  if (step === "confirm") return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow', sans-serif", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>✅</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", letterSpacing: 2, marginBottom: ".5rem" }}>ORDER PLACED!</h1>
        <div style={{ color: "#e5202e", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: 2, marginBottom: "1rem" }}>{orderId}</div>
        <p style={{ color: "#666", lineHeight: 1.7, marginBottom: "2rem" }}>
          A confirmation has been sent to <strong style={{ color: "#f5f5f5" }}>{form.email}</strong>.<br />
          You can track your order anytime from your account.
        </p>
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem", marginBottom: "2rem", textAlign: "left" }}>
          <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: "1rem" }}>Order Summary</div>
          {cart.map(i => (
            <div key={i._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem", fontSize: ".85rem" }}>
              <span style={{ color: "#888" }}>{i.name} {i.selectedSize && `(${i.selectedSize})`} × {i.qty}</span>
              <span style={{ fontWeight: 700 }}>${(finalPrice(i) * i.qty).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #1e1e1e", marginTop: ".75rem", paddingTop: ".75rem", display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
            <span>TOTAL</span><span style={{ color: "#e5202e" }}>${total}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link href="/" style={{ background: "#f5f5f5", color: "#0a0a0a", padding: ".8rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>KEEP SHOPPING</Link>
          <Link href="/orders" style={{ border: "1px solid #222", color: "#888", padding: ".8rem 2rem", fontWeight: 700, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>TRACK ORDER</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: 64, background: "rgba(10,10,10,0.97)", borderBottom: "1px solid #1e1e1e" }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>TRIDENT</Link>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: 3, textTransform: "uppercase", color: "#666" }}>CHECKOUT</div>
        <Link href="/" style={{ color: "#666", fontSize: ".78rem", fontWeight: 700, letterSpacing: 1, textDecoration: "none" }}>✕ CANCEL</Link>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "3rem" }}>

        {/* ── Left: Form ── */}
        <div>
          {/* Steps */}
          <div style={{ display: "flex", gap: "2rem", marginBottom: "2.5rem" }}>
            {[["details","DETAILS"],["payment","PAYMENT"]].map(([s, l]) => (
              <button key={s} onClick={() => step === "payment" && s === "details" && setStep("details")}
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: 2, textTransform: "uppercase", background: "none", border: "none", color: step === s ? "#f5f5f5" : "#444", cursor: "pointer", paddingBottom: ".4rem", borderBottom: step === s ? "2px solid #e5202e" : "2px solid transparent" }}>
                {l}
              </button>
            ))}
          </div>

          {step === "details" && (
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2, marginBottom: "1.5rem" }}>CONTACT INFORMATION</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div><label style={LABEL}>First Name</label><input style={INP} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="John Doe" /></div>
                <div><label style={LABEL}>Email *</label><input style={INP} type="email" value={form.email} onChange={e => setF("email", e.target.value)} placeholder="john@email.com" /></div>
              </div>
              <div style={{ marginBottom: "1rem" }}><label style={LABEL}>Phone</label><input style={INP} value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="+91 98765 43210" /></div>

              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2, margin: "2rem 0 1.5rem" }}>SHIPPING ADDRESS</div>
              <div style={{ marginBottom: "1rem" }}><label style={LABEL}>Address</label><input style={INP} value={form.address} onChange={e => setF("address", e.target.value)} placeholder="123 Main Street, Apt 4B" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div><label style={LABEL}>City</label><input style={INP} value={form.city} onChange={e => setF("city", e.target.value)} placeholder="Chennai" /></div>
                <div><label style={LABEL}>State</label><input style={INP} value={form.state} onChange={e => setF("state", e.target.value)} placeholder="Tamil Nadu" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                <div><label style={LABEL}>PIN Code</label><input style={INP} value={form.zip} onChange={e => setF("zip", e.target.value)} placeholder="600001" /></div>
                <div><label style={LABEL}>Country</label>
                  <select style={{ ...INP, appearance: "none" }} value={form.country} onChange={e => setF("country", e.target.value)}>
                    {["India","United States","United Kingdom","Singapore","UAE","Australia"].map(c => <option key={c} style={{ background: "#111" }}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => { if (form.name && form.email && form.address) setStep("payment") }}
                style={{ width: "100%", background: "#e5202e", color: "#fff", border: "none", padding: "1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
                CONTINUE TO PAYMENT →
              </button>
            </div>
          )}

          {step === "payment" && (
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2, marginBottom: "1.5rem" }}>PAYMENT METHOD</div>

              {/* Payment methods */}
              {[
                { value: "card", label: "💳  Credit / Debit Card" },
                { value: "upi",  label: "📱  UPI" },
                { value: "cod",  label: "💵  Cash on Delivery" },
              ].map(pm => (
                <label key={pm.value} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: `1px solid ${form.paymentMethod === pm.value ? "#e5202e" : "#1e1e1e"}`, marginBottom: ".75rem", cursor: "pointer", background: form.paymentMethod === pm.value ? "rgba(229,32,46,.06)" : "transparent" }}>
                  <input type="radio" name="pm" value={pm.value} checked={form.paymentMethod === pm.value} onChange={e => setF("paymentMethod", e.target.value)} style={{ accentColor: "#e5202e" }} />
                  <span style={{ fontWeight: 700, fontSize: ".88rem" }}>{pm.label}</span>
                </label>
              ))}

              {form.paymentMethod === "card" && (
                <div style={{ marginTop: "1.5rem" }}>
                  <div style={{ marginBottom: "1rem" }}><label style={LABEL}>Card Number</label><input style={INP} placeholder="4242 4242 4242 4242" maxLength={19} value={form.cardNumber} onChange={e => setF("cardNumber", e.target.value)} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ gridColumn: "span 2" }}><label style={LABEL}>Name on Card</label><input style={INP} placeholder="John Doe" value={form.cardName} onChange={e => setF("cardName", e.target.value)} /></div>
                    <div><label style={LABEL}>Expiry</label><input style={INP} placeholder="MM/YY" value={form.cardExpiry} onChange={e => setF("cardExpiry", e.target.value)} /></div>
                  </div>
                  <div style={{ width: "33%" }}><label style={LABEL}>CVV</label><input style={INP} type="password" placeholder="•••" maxLength={4} value={form.cardCvv} onChange={e => setF("cardCvv", e.target.value)} /></div>
                </div>
              )}

              {form.paymentMethod === "upi" && (
                <div style={{ marginTop: "1.5rem" }}><label style={LABEL}>UPI ID</label><input style={INP} placeholder="yourname@upi" value={form.upiId} onChange={e => setF("upiId", e.target.value)} /></div>
              )}

              {form.paymentMethod === "cod" && (
                <div style={{ marginTop: "1.5rem", background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1rem", fontSize: ".85rem", color: "#888" }}>
                  ₹49 COD fee applies. Payment collected at delivery.
                </div>
              )}

              <button onClick={placeOrder} disabled={placing}
                style={{ width: "100%", background: placing ? "#555" : "#e5202e", color: "#fff", border: "none", padding: "1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase", cursor: placing ? "not-allowed" : "pointer", marginTop: "2rem" }}>
                {placing ? "PLACING ORDER…" : `PLACE ORDER — $${total}`}
              </button>
              <p style={{ textAlign: "center", color: "#444", fontSize: ".75rem", marginTop: ".75rem" }}>🔒 SSL encrypted. Your payment info is safe.</p>
            </div>
          )}
        </div>

        {/* ── Right: Order Summary ── */}
        <div>
          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem", position: "sticky", top: 80 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: 2, marginBottom: "1.5rem" }}>ORDER SUMMARY</div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {cart.map(item => {
                const fp = finalPrice(item)
                return (
                  <div key={item._id + item.selectedSize} style={{ display: "flex", gap: ".75rem", marginBottom: "1rem" }}>
                    <div style={{ position: "relative", width: 60, height: 60, background: "#111", flexShrink: 0 }}>
                      <Image src={safeImg(item.image)} alt={item.name} fill style={{ objectFit: "cover" }} unoptimized />
                      <span style={{ position: "absolute", top: -6, right: -6, background: "#e5202e", color: "#fff", width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".6rem", fontWeight: 800 }}>{item.qty}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: ".82rem", fontWeight: 700 }}>{item.name}</div>
                      {item.selectedSize && <div style={{ color: "#666", fontSize: ".72rem" }}>Size: {item.selectedSize}</div>}
                      <div style={{ fontWeight: 700, marginTop: ".2rem" }}>${(fp * item.qty).toFixed(2)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ borderTop: "1px solid #1e1e1e", marginTop: "1rem", paddingTop: "1rem" }}>
              {[["Subtotal", `$${subtotal.toFixed(2)}`], ["Shipping", shipping === 0 ? "FREE" : `$${shipping}`], ["GST (18%)", `$${tax}`]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".6rem", fontSize: ".85rem" }}>
                  <span style={{ color: "#666" }}>{l}</span>
                  <span style={{ color: v === "FREE" ? "#22c55e" : "#f5f5f5", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", borderTop: "1px solid #1e1e1e", paddingTop: ".75rem", marginTop: ".5rem" }}>
                <span>TOTAL</span>
                <span style={{ color: "#e5202e" }}>${total}</span>
              </div>
            </div>
            {subtotal < 500 && (
              <div style={{ marginTop: "1rem", background: "rgba(229,32,46,.08)", border: "1px solid rgba(229,32,46,.2)", padding: ".75rem", fontSize: ".78rem", color: "#e5202e" }}>
                Add ${(500 - subtotal).toFixed(2)} more for free shipping!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
