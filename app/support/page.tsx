"use client"

import { useState } from "react"
import Link from "next/link"

const INP: React.CSSProperties = {
  width: "100%", background: "#0d0d0d", border: "1px solid #1e1e1e",
  color: "#f5f5f5", padding: ".85rem 1rem",
  fontFamily: "'Barlow', sans-serif", fontSize: ".92rem", outline: "none",
}
const LABEL: React.CSSProperties = {
  display: "block", fontSize: ".7rem", fontWeight: 700,
  letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".5rem",
}

const ISSUE_TYPES = [
  { value: "support",              label: "📦  Order Issue / General Query"  },
  { value: "cancel_request",       label: "✕  Cancel an Order"               },
  { value: "return_request",       label: "↩  Return an Item"                },
  { value: "replacement_request",  label: "🔄  Request a Replacement"         },
]

const FAQS = [
  { q: "How do I track my order?",      a: "Go to Account → My Orders or visit the Track Order page and enter your order ID." },
  { q: "What is your return policy?",   a: "We accept returns within 30 days of delivery for unused items in original packaging." },
  { q: "How long does shipping take?",  a: "Standard shipping: 3–7 business days. Express: 1–2 business days." },
  { q: "Can I change my order?",        a: "Orders can only be modified while they are in Pending status. Contact support immediately." },
  { q: "Where do you ship to?",         a: "We ship to India, US, UK, Singapore, UAE and Australia." },
]

export default function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", type: "support", orderId: "", subject: "", message: "" })
  const [sending,  setSending]  = useState(false)
  const [ticketId, setTicketId] = useState("")
  const [error,    setError]    = useState("")
  const [faqOpen,  setFaqOpen]  = useState<number | null>(null)

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Please fill in all required fields."); return
    }
    setSending(true); setError("")
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:          form.type,
          subject:       form.subject,
          message:       form.message,
          customerName:  form.name,
          customerEmail: form.email,
          orderId:       form.orderId,
        }),
      })
      const j = await res.json()
      if (j.success) {
        setTicketId(j.data.ticketId)
      } else {
        setError(j.error || "Failed to submit. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    }
    setSending(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: 64, background: "rgba(10,10,10,0.97)", borderBottom: "1px solid #1e1e1e" }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>TRIDENT</Link>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: 3, textTransform: "uppercase", color: "#666" }}>SUPPORT</div>
        <Link href="/" style={{ color: "#666", fontSize: ".78rem", fontWeight: 700, letterSpacing: 1, textDecoration: "none" }}>← BACK</Link>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 2rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "4rem" }}>

        {/* Left — contact form */}
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", letterSpacing: 2, marginBottom: ".5rem" }}>
            HOW CAN WE<br /><span style={{ color: "#e5202e" }}>HELP YOU?</span>
          </h1>
          <p style={{ color: "#555", fontSize: ".9rem", lineHeight: 1.7, marginBottom: "2.5rem" }}>
            Our team typically responds within <strong style={{ color: "#888" }}>24–48 hours</strong>.
            For order-related issues, please have your Order ID handy.
          </p>

          {ticketId ? (
            <div style={{ background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.25)", padding: "2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 2, marginBottom: ".5rem" }}>REQUEST RECEIVED</div>
              <div style={{ color: "#22c55e", fontWeight: 700, marginBottom: ".5rem" }}>Ticket ID: {ticketId}</div>
              <p style={{ color: "#666", fontSize: ".85rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                We&apos;ve received your request and will reply to <strong style={{ color: "#888" }}>{form.email}</strong> shortly.
              </p>
              <Link href="/" style={{ display: "inline-block", background: "#e5202e", color: "#fff", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
                CONTINUE SHOPPING
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div><label style={LABEL}>Full Name *</label><input style={INP} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="John Doe" /></div>
                <div><label style={LABEL}>Email *</label><input style={INP} type="email" value={form.email} onChange={e => setF("email", e.target.value)} placeholder="john@email.com" /></div>
              </div>

              <div>
                <label style={LABEL}>Type of Request *</label>
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                  {ISSUE_TYPES.map(t => (
                    <label key={t.value} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: ".85rem 1rem", border: `1px solid ${form.type === t.value ? "#e5202e" : "#1e1e1e"}`, background: form.type === t.value ? "rgba(229,32,46,.06)" : "transparent", cursor: "pointer" }}>
                      <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={e => setF("type", e.target.value)} style={{ accentColor: "#e5202e" }} />
                      <span style={{ fontWeight: 600, fontSize: ".88rem" }}>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.type !== "support" && (
                <div><label style={LABEL}>Order ID (if applicable)</label><input style={INP} value={form.orderId} onChange={e => setF("orderId", e.target.value)} placeholder="TRD-20260310-XXXXXX" /></div>
              )}

              <div><label style={LABEL}>Subject *</label><input style={INP} value={form.subject} onChange={e => setF("subject", e.target.value)} placeholder="Brief description of your issue" /></div>

              <div>
                <label style={LABEL}>Message *</label>
                <textarea style={{ ...INP, height: 140, resize: "vertical" }} value={form.message} onChange={e => setF("message", e.target.value)} placeholder="Please describe your issue in detail…" />
              </div>

              {error && <div style={{ background: "rgba(229,32,46,.1)", border: "1px solid rgba(229,32,46,.3)", padding: ".75rem 1rem", color: "#e5202e", fontSize: ".82rem", fontWeight: 600 }}>⚠ {error}</div>}

              <button type="submit" disabled={sending}
                style={{ background: sending ? "#333" : "#e5202e", color: "#fff", border: "none", padding: "1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase", cursor: sending ? "not-allowed" : "pointer" }}>
                {sending ? "SUBMITTING…" : "SUBMIT REQUEST →"}
              </button>
            </form>
          )}
        </div>

        {/* Right — FAQ + contact info */}
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2, marginBottom: "1.5rem" }}>QUICK ANSWERS</div>

          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid #1a1a1a" }}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", background: "none", border: "none", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".82rem", textAlign: "left", cursor: "pointer" }}>
                {faq.q}
                <span style={{ color: "#e5202e", fontSize: "1rem", flexShrink: 0 }}>{faqOpen === i ? "−" : "+"}</span>
              </button>
              {faqOpen === i && (
                <p style={{ color: "#666", fontSize: ".82rem", lineHeight: 1.7, paddingBottom: "1rem", margin: 0 }}>{faq.a}</p>
              )}
            </div>
          ))}

          <div style={{ marginTop: "2.5rem", background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: 2, marginBottom: "1rem" }}>OTHER WAYS TO REACH US</div>
            {[
              { icon: "📧", label: "Email",    value: "support@trident.store" },
              { icon: "📱", label: "WhatsApp", value: "+91 98765 43210"        },
              { icon: "⏰", label: "Hours",    value: "Mon–Sat, 10am – 7pm IST" },
            ].map(c => (
              <div key={c.label} style={{ display: "flex", gap: ".75rem", marginBottom: ".85rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#444", marginBottom: ".2rem" }}>{c.label}</div>
                  <div style={{ fontSize: ".82rem", color: "#888" }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
