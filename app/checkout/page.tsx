"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/context/CurrencyContext"
import { useCart } from "@/context/CartContext"

type CartItem = {
  _id: string; name: string; price: number; image?: string
  qty: number; selectedSize?: string; couponDiscount?: number
}

type SavedAddress = {
  _id: string; label: string; name: string; phone: string
  address: string; city: string; state: string; zip: string; country: string; isDefault: boolean
}

function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:")) ? url : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=60"
}
function finalPrice(p: CartItem) {
  return p.couponDiscount ? +(p.price * (1 - p.couponDiscount / 100)).toFixed(2) : p.price
}

export default function CheckoutPage() {
  const router = useRouter()
  const { fmt, getShipping, mismatch, taxRate, currency, shippingFreeThreshold } = useCurrency()
  const { clearCart } = useCart()

  const INP: React.CSSProperties = {
    width: "100%", background: "#0d0d0d", border: "1px solid #1e1e1e",
    color: "#f5f5f5", padding: ".75rem 1rem",
    fontFamily: "'Barlow', sans-serif", fontSize: ".88rem", outline: "none",
  }
  const LABEL: React.CSSProperties = {
    display: "block", fontSize: ".7rem", fontWeight: 700,
    letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".4rem",
  }

  const [cart, setCart]             = useState<CartItem[]>([])
  const [step, setStep]             = useState<"auth" | "details" | "payment" | "confirm">("auth")
  const [placing, setPlacing]       = useState(false)
  const [orderId, setOrderId]       = useState("")
  const [orderError, setOrderError] = useState("")
  const [isGuest, setIsGuest]       = useState(false)
  const [savedAddrs, setSavedAddrs] = useState<SavedAddress[]>([])

  const [currencyError, setCurrencyError] = useState("")

  // OTP auth state (shown when not already signed in)
  const [authStep, setAuthStep]     = useState<"email" | "verify">("email")
  const [authEmail, setAuthEmail]   = useState("")
  const [authName,  setAuthName]    = useState("")
  const [authOtp,   setAuthOtp]     = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError]   = useState("")

  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", country: "India",
    cardNumber: "", cardExpiry: "", cardCvv: "", cardName: "",
    paymentMethod: "card" as "card" | "upi" | "cod",
    upiId: "",
  })

  useEffect(() => {
    const cust = localStorage.getItem("trident_customer")
    const saved = sessionStorage.getItem("trident_cart")
    if (saved) setCart(JSON.parse(saved))

    if (cust) {
      loadCustomer(JSON.parse(cust), saved)
    }
    // if no cust: step stays "auth"
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function loadCustomer(c: { name?: string; email: string }, savedCart?: string | null) {
    setForm(f => ({ ...f, name: c.name || "", email: c.email || "" }))
    setIsGuest(false)
    setStep("details")

    fetch("/api/addresses", { headers: { "x-customer-email": c.email } })
      .then(r => r.json())
      .then(j => {
        if (j.success && j.data?.length) {
          setSavedAddrs(j.data)
          const def = j.data.find((a: SavedAddress) => a.isDefault) || j.data[0]
          if (def) setForm(f => ({ ...f, name: def.name || f.name, phone: def.phone || f.phone, address: def.address, city: def.city, state: def.state, zip: def.zip, country: def.country }))
        }
      })
      .catch(() => {})

    const cart = savedCart || sessionStorage.getItem("trident_cart")
    if (cart) {
      const items = JSON.parse(cart)
      const total = items.reduce((s: number, i: CartItem) => s + finalPrice(i) * i.qty, 0)
      fetch("/api/cart-session", { method: "POST", headers: { "Content-Type": "application/json", "x-customer-email": c.email }, body: JSON.stringify({ items, total, customerName: c.name }) }).catch(() => {})
    }
  }

  const subtotal = cart.reduce((s, i) => s + finalPrice(i) * i.qty, 0)
  const shipping = getShipping(subtotal, form.country)
  const tax      = +(subtotal * (taxRate / 100)).toFixed(2)
  const total    = +(subtotal + shipping + tax).toFixed(2)

  async function sendOtp() {
    if (!authEmail) return setAuthError("Please enter your email.")
    setAuthLoading(true); setAuthError("")
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, name: authName, action: "sendOtp" }),
      })
      const j = await res.json()
      if (j.success) setAuthStep("verify")
      else setAuthError(j.error || "Failed to send OTP.")
    } catch { setAuthError("Network error. Please try again.") }
    setAuthLoading(false)
  }

  async function verifyOtp() {
    if (!authOtp) return setAuthError("Enter the OTP sent to your email.")
    setAuthLoading(true); setAuthError("")
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, name: authName, otp: authOtp, action: "verifyOtp" }),
      })
      const j = await res.json()
      if (j.success) {
        localStorage.setItem("trident_customer", JSON.stringify(j.data))
        loadCustomer(j.data)
      } else {
        setAuthError(j.error || "Invalid OTP.")
      }
    } catch { setAuthError("Network error. Please try again.") }
    setAuthLoading(false)
  }

  function setF(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    if (key === "paymentMethod") {
      setCurrencyError(mismatch(val) || "")
    }
    if (key === "country") {
      // country change may affect shipping — no error needed
    }
  }

  function applyAddress(a: SavedAddress) {
    setForm(f => ({ ...f, name: a.name, phone: a.phone, address: a.address, city: a.city, state: a.state, zip: a.zip, country: a.country }))
  }

  async function placeOrder() {
    // Check currency mismatch before placing
    const misErr = mismatch(form.paymentMethod)
    if (misErr) { setCurrencyError(misErr); return }

    if (!form.name || !form.email || !form.address) return
    setPlacing(true)
    setOrderError("")

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 12000)

    try {
      const shippingAddress = `${form.address}, ${form.city}, ${form.state} ${form.zip}, ${form.country}`
      const cust = localStorage.getItem("trident_customer")
      const customerEmail = cust ? JSON.parse(cust).email : form.email

      if (!isGuest && form.address) {
        fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-customer-email": customerEmail },
          body: JSON.stringify({ label: "Saved", name: form.name, phone: form.phone, address: form.address, city: form.city, state: form.state, zip: form.zip, country: form.country }),
        }).catch(() => {})
      }

      if (form.paymentMethod === "card") {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            cart: cart.map(i => ({ ...i, price: finalPrice(i) })),
            customer: { name: form.name, email: form.email, phone: form.phone },
            shippingAddress,
            currency,
          }),
        })
        const j = await res.json()
        if (j.url) {
          fetch("/api/cart-session", { method: "DELETE", headers: { "x-customer-email": customerEmail } }).catch(() => {})
          sessionStorage.removeItem("trident_cart")
          clearCart()
          window.location.href = j.url
          return
        }
        setOrderError(j.error || "Payment could not be initiated. Please try again.")
      } else {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            customer: { name: form.name, email: form.email, phone: form.phone, address: shippingAddress },
            items: cart.map(i => ({ productId: i._id, name: i.name, price: finalPrice(i), qty: i.qty, size: i.selectedSize })),
            totalAmount: total,
            paymentMethod: form.paymentMethod,
            paymentStatus: "pending",
            status: "pending",
            currency,
          }),
        })
        const j = await res.json()
        if (j.success) {
          fetch("/api/cart-session", { method: "DELETE", headers: { "x-customer-email": customerEmail } }).catch(() => {})
          setOrderId(j.data.orderId)
          sessionStorage.removeItem("trident_cart")
          clearCart()
          setStep("confirm")
          return
        }
        setOrderError(j.error || "Failed to place order. Please try again.")
      }
    } catch (e: unknown) {
      const isTimeout = e instanceof Error && (e.name === "AbortError" || e.message.includes("timeout"))
      setOrderError(isTimeout
        ? "Request timed out — our servers may be busy. Please try again in a moment."
        : "Something went wrong. Please check your connection and try again.")
    } finally {
      clearTimeout(timeoutId)
      setPlacing(false)
    }
  }

  if (step === "confirm") return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow', sans-serif", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>✅</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", letterSpacing: 2, marginBottom: ".5rem" }}>ORDER PLACED!</h1>
        <div style={{ color: "#e5202e", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: 2, marginBottom: "1rem" }}>{orderId}</div>
        <p style={{ color: "#666", lineHeight: 1.7, marginBottom: "2rem" }}>
          A confirmation has been sent to <strong style={{ color: "#f5f5f5" }}>{form.email}</strong>.<br />
          Track your order anytime from the link below.
        </p>
        <div style={{ background: "#0d0d0d", border: `1px solid #1e1e1e`, padding: "1.5rem", marginBottom: "2rem", textAlign: "left" }}>
          <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: "1rem" }}>Order Summary</div>
          {cart.map(i => (
            <div key={`${i._id}-${i.selectedSize}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem", fontSize: ".85rem" }}>
              <span style={{ color: "#888" }}>{i.name} {i.selectedSize && `(${i.selectedSize})`} × {i.qty}</span>
              <span style={{ fontWeight: 700 }}>{fmt(finalPrice(i) * i.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid #1e1e1e`, marginTop: ".75rem", paddingTop: ".75rem", display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
            <span>TOTAL</span><span style={{ color: "#e5202e" }}>{fmt(total)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ background: "#f5f5f5", color: "#0a0a0a", padding: ".8rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>KEEP SHOPPING</Link>
          <Link href={orderId ? `/track?id=${orderId}` : "/track"} style={{ border: `1px solid #1e1e1e`, color: "#888", padding: ".8rem 2rem", fontWeight: 700, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>TRACK ORDER</Link>
        </div>
        {isGuest && (
          <div style={{ marginTop: "1.5rem", background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)", padding: "1rem", fontSize: ".78rem", color: "#3b82f6" }}>
            💡 <Link href="/signin" style={{ color: "#3b82f6", fontWeight: 700 }}>Create an account</Link> to track orders and save addresses.
          </div>
        )}
      </div>
    </div>
  )

  // ── Auth gate (shown when not signed in) ────────────────────────────────────
  if (step === "auth") return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", display: "flex", flexDirection: "column", fontFamily: "'Barlow', sans-serif" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: 64, borderBottom: "1px solid #1e1e1e" }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>TRIDENT</Link>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: 3, textTransform: "uppercase", color: "#666" }}>CHECKOUT</div>
        <Link href="/" style={{ color: "#666", fontSize: ".78rem", fontWeight: 700, letterSpacing: 1, textDecoration: "none" }}>✕ CANCEL</Link>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 2rem" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#e5202e", marginBottom: ".5rem" }}>
            Step 1 of 3
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", letterSpacing: 2, marginBottom: ".5rem" }}>
            {authStep === "email" ? "VERIFY YOUR EMAIL" : "ENTER YOUR OTP"}
          </h1>
          <p style={{ color: "#555", fontSize: ".88rem", marginBottom: "2.5rem", lineHeight: 1.6 }}>
            {authStep === "email"
              ? "We'll send a one-time code to confirm your identity before checkout."
              : `A 6-digit code was sent to ${authEmail}. Enter it below to continue.`}
          </p>

          {authStep === "email" ? (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: ".7rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".5rem" }}>Full Name</label>
                <input
                  style={{ width: "100%", background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".85rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".92rem", outline: "none" }}
                  placeholder="John Doe" value={authName} onChange={e => setAuthName(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = "#333")} onBlur={e => (e.target.style.borderColor = "#1e1e1e")} />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: ".7rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".5rem" }}>Email Address *</label>
                <input
                  style={{ width: "100%", background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".85rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".92rem", outline: "none" }}
                  type="email" placeholder="john@email.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = "#333")} onBlur={e => (e.target.style.borderColor = "#1e1e1e")}
                  onKeyDown={e => e.key === "Enter" && sendOtp()} />
              </div>
              {authError && <div style={{ color: "#e5202e", fontSize: ".82rem", fontWeight: 600, marginBottom: "1rem" }}>{authError}</div>}
              <button onClick={sendOtp} disabled={authLoading}
                style={{ width: "100%", background: authLoading ? "#333" : "#e5202e", color: "#fff", border: "none", padding: "1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase", cursor: authLoading ? "not-allowed" : "pointer" }}>
                {authLoading ? "SENDING…" : "SEND OTP →"}
              </button>
              <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: ".78rem", color: "#444" }}>
                Already have an account?{" "}
                <Link href={`/signin?redirect=/checkout`} style={{ color: "#888", fontWeight: 700 }}>Sign in here</Link>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: ".7rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".5rem" }}>6-Digit OTP</label>
                <input
                  style={{ width: "100%", background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".85rem 1rem", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: "1rem", textAlign: "center", outline: "none" }}
                  placeholder="------" maxLength={6} value={authOtp}
                  onChange={e => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={e => e.key === "Enter" && verifyOtp()} />
              </div>
              {authError && <div style={{ color: "#e5202e", fontSize: ".82rem", fontWeight: 600, marginBottom: "1rem" }}>{authError}</div>}
              <button onClick={verifyOtp} disabled={authLoading}
                style={{ width: "100%", background: authLoading ? "#333" : "#e5202e", color: "#fff", border: "none", padding: "1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase", cursor: authLoading ? "not-allowed" : "pointer", marginBottom: ".75rem" }}>
                {authLoading ? "VERIFYING…" : "VERIFY & CONTINUE →"}
              </button>
              <button onClick={() => { setAuthStep("email"); setAuthOtp(""); setAuthError("") }}
                style={{ width: "100%", background: "transparent", color: "#666", border: "1px solid #1e1e1e", padding: ".75rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
                ← CHANGE EMAIL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: 64, background: "rgba(10,10,10,0.97)", borderBottom: `1px solid #1e1e1e` }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>TRIDENT</Link>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: 3, textTransform: "uppercase", color: "#666" }}>CHECKOUT</div>
        <Link href="/" style={{ color: "#666", fontSize: ".78rem", fontWeight: 700, letterSpacing: 1, textDecoration: "none" }}>✕ CANCEL</Link>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "3rem" }}>

        {/* Left: Form */}
        <div>
          <div style={{ display: "flex", gap: "2rem", marginBottom: "2.5rem" }}>
            {[["details","DETAILS"],["payment","PAYMENT"]].map(([s, l]) => (
              <button key={s} onClick={() => step === "payment" && s === "details" && setStep("details")}
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: 2, textTransform: "uppercase", background: "none", border: "none", color: step === s ? "#f5f5f5" : "#1e1e1e", cursor: "pointer", paddingBottom: ".4rem", borderBottom: step === s ? "2px solid #e5202e" : "2px solid transparent" }}>
                {l}
              </button>
            ))}
          </div>

          {step === "details" && (
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2, marginBottom: "1.5rem" }}>CONTACT INFORMATION</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div><label style={LABEL}>Full Name *</label><input style={INP} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="John Doe" /></div>
                <div><label style={LABEL}>Email *</label><input style={INP} type="email" value={form.email} onChange={e => setF("email", e.target.value)} placeholder="john@email.com" /></div>
              </div>
              <div style={{ marginBottom: "1rem" }}><label style={LABEL}>Phone</label><input style={INP} value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="+91 98765 43210" /></div>

              {!isGuest && savedAddrs.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".75rem" }}>SAVED ADDRESSES</div>
                  <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                    {savedAddrs.map(a => (
                      <button key={a._id} onClick={() => applyAddress(a)}
                        style={{ background: form.address === a.address ? "rgba(229,32,46,.1)" : "#0d0d0d", border: `1px solid ${form.address === a.address ? "#e5202e" : "#1e1e1e"}`, color: form.address === a.address ? "#f5f5f5" : "#666", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, cursor: "pointer", textAlign: "left" }}>
                        <div style={{ color: form.address === a.address ? "#e5202e" : "#888", fontSize: ".6rem", fontWeight: 700, letterSpacing: 1.5, marginBottom: ".2rem" }}>{a.label}</div>
                        <div style={{ fontSize: ".72rem" }}>{a.address}, {a.city}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2, margin: "2rem 0 1.5rem" }}>SHIPPING ADDRESS</div>
              <div style={{ marginBottom: "1rem" }}><label style={LABEL}>Address *</label><input style={INP} value={form.address} onChange={e => setF("address", e.target.value)} placeholder="123 Main Street, Apt 4B" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div><label style={LABEL}>City</label><input style={INP} value={form.city} onChange={e => setF("city", e.target.value)} placeholder="Chennai" /></div>
                <div><label style={LABEL}>State</label><input style={INP} value={form.state} onChange={e => setF("state", e.target.value)} placeholder="Tamil Nadu" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                <div><label style={LABEL}>PIN Code</label><input style={INP} value={form.zip} onChange={e => setF("zip", e.target.value)} placeholder="600001" /></div>
                <div><label style={LABEL}>Country</label>
                  <select style={{ ...INP, appearance: "none" }} value={form.country} onChange={e => setF("country", e.target.value)}>
                    {["India","United States","United Kingdom","Singapore","UAE","Australia"].map(ct => <option key={ct} style={{ background: "#0d0d0d" }}>{ct}</option>)}
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

              {/* Currency mismatch error */}
              {currencyError && (
                <div style={{ background: "rgba(229,32,46,.1)", border: "1px solid rgba(229,32,46,.4)", padding: "1rem", color: "#e5202e", fontSize: ".82rem", fontWeight: 600, lineHeight: 1.6, marginBottom: "1rem" }}>
                  ⚠ {currencyError}
                </div>
              )}

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
                <div style={{ marginTop: "1.5rem", background: "#0d0d0d", border: `1px solid #1e1e1e`, padding: "1rem", fontSize: ".85rem", color: "#888" }}>
                  ₹49 COD fee applies. Payment collected at delivery.
                </div>
              )}

              {orderError && (
                <div style={{ background: "rgba(229,32,46,.1)", border: "1px solid rgba(229,32,46,.3)", padding: ".85rem 1rem", color: "#e5202e", fontSize: ".82rem", fontWeight: 600, lineHeight: 1.5, marginTop: "1.5rem" }}>
                  ⚠ {orderError}
                </div>
              )}

              <button
                onClick={placeOrder}
                disabled={placing || !!currencyError}
                style={{ width: "100%", background: (placing || !!currencyError) ? "#555" : "#e5202e", color: "#fff", border: "none", padding: "1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase", cursor: (placing || !!currencyError) ? "not-allowed" : "pointer", marginTop: "1rem" }}>
                {placing ? "PLACING ORDER…" : `PLACE ORDER — ${fmt(total)}`}
              </button>
              <p style={{ textAlign: "center", color: "#666", fontSize: ".75rem", marginTop: ".75rem" }}>🔒 SSL encrypted. Your payment info is safe.</p>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div>
          <div style={{ background: "#0d0d0d", border: `1px solid #1e1e1e`, padding: "1.5rem", position: "sticky", top: 80 }}>
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
                      <div style={{ fontWeight: 700, marginTop: ".2rem" }}>{fmt(fp * item.qty)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ borderTop: `1px solid #1e1e1e`, marginTop: "1rem", paddingTop: "1rem" }}>
              {[["Subtotal", fmt(subtotal)], ["Shipping", shipping === 0 ? "FREE" : fmt(shipping)], [`Tax (${taxRate}%)`, fmt(tax)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".6rem", fontSize: ".85rem" }}>
                  <span style={{ color: "#666" }}>{l}</span>
                  <span style={{ color: v === "FREE" ? "#22c55e" : "#f5f5f5", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", borderTop: `1px solid #1e1e1e`, paddingTop: ".75rem", marginTop: ".5rem" }}>
                <span>TOTAL</span>
                <span style={{ color: "#e5202e" }}>{fmt(total)}</span>
              </div>
            </div>
            {subtotal < shippingFreeThreshold && (
              <div style={{ marginTop: "1rem", background: "rgba(229,32,46,.08)", border: "1px solid rgba(229,32,46,.2)", padding: ".75rem", fontSize: ".78rem", color: "#e5202e" }}>
                Add {fmt(shippingFreeThreshold - subtotal)} more for free shipping!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
