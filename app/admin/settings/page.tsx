"use client"

import { useEffect, useState } from "react"

type ShippingCountryRate = { country: string; rate: number }

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Singapore", "UAE", "Australia",
  "Canada", "Germany", "France", "Japan", "South Korea", "Brazil",
]

export default function AdminSettingsPage() {
  const [messages,              setMessages]              = useState<string[]>([])
  const [newMsg,                setNewMsg]                = useState("")
  const [currency,              setCurrency]              = useState<"USD" | "INR" | "EUR">("USD")
  const [shippingFreeThreshold, setShippingFreeThreshold] = useState(500)
  const [shippingFlatRate,      setShippingFlatRate]      = useState(49)
  const [countryRates,          setCountryRates]          = useState<ShippingCountryRate[]>([])
  const [newCountry,            setNewCountry]            = useState("India")
  const [newCountryRate,        setNewCountryRate]        = useState("")
  const [taxRate,               setTaxRate]               = useState(18)
  const [saving,                setSaving]                = useState(false)
  const [feedback,              setFeedback]              = useState("")
  const [loading,               setLoading]               = useState(true)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setMessages(d.data.promoBannerMessages || [])
          setCurrency(d.data.currency || "USD")
          setShippingFreeThreshold(d.data.shippingFreeThreshold ?? 500)
          setShippingFlatRate(d.data.shippingFlatRate ?? 49)
          setCountryRates(d.data.shippingCountryRates || [])
          setTaxRate(d.data.taxRate ?? 18)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Promo banner helpers ──
  function addMessage() {
    const t = newMsg.trim()
    if (!t || messages.length >= 20) return
    setMessages(prev => [...prev, t])
    setNewMsg("")
    setFeedback("")
  }
  function removeMessage(i: number) { setMessages(prev => prev.filter((_, idx) => idx !== i)) }
  function moveUp(i: number) {
    if (i === 0) return
    setMessages(prev => { const n = [...prev]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n })
  }
  function moveDown(i: number) {
    if (i === messages.length - 1) return
    setMessages(prev => { const n = [...prev]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n })
  }

  // ── Country rate helpers ──
  function addCountryRate() {
    const rate = parseFloat(newCountryRate)
    if (!newCountry || isNaN(rate) || rate < 0) return
    setCountryRates(prev => {
      const existing = prev.findIndex(r => r.country === newCountry)
      if (existing >= 0) {
        const updated = [...prev]; updated[existing] = { country: newCountry, rate }; return updated
      }
      return [...prev, { country: newCountry, rate }]
    })
    setNewCountryRate("")
  }
  function removeCountryRate(i: number) { setCountryRates(prev => prev.filter((_, idx) => idx !== i)) }

  // ── Save ──
  async function saveSettings() {
    setSaving(true)
    setFeedback("")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoBannerMessages:  messages,
          currency,
          shippingFreeThreshold,
          shippingFlatRate,
          shippingCountryRates: countryRates,
          taxRate,
        }),
      })
      const d = await res.json()
      setFeedback(d.success ? "✓ Settings saved successfully." : `Error: ${d.error || "Failed to save."}`)
    } catch {
      setFeedback("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", INR: "₹", EUR: "€" }
  const sym = CURRENCY_SYMBOLS[currency]

  if (loading) return <div style={{ color: "#555", padding: "3rem", textAlign: "center" }}>Loading…</div>

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 3, marginBottom: ".3rem" }}>
          SITE SETTINGS
        </h1>
        <p style={{ color: "#555", fontSize: ".85rem" }}>Manage currency, shipping, tax, and storefront banner messages.</p>
      </div>

      {/* ── Currency ───────────────────────────────────────────────────── */}
      <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.75rem", maxWidth: 720, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>💱</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".9rem", letterSpacing: 1 }}>STORE CURRENCY</div>
            <div style={{ color: "#555", fontSize: ".78rem", marginTop: ".2rem" }}>
              All prices across the storefront will display in this currency. Changing this affects checkout calculations.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
          {(["USD", "INR", "EUR"] as const).map(c => (
            <button key={c} onClick={() => setCurrency(c)}
              style={{
                padding: ".65rem 1.5rem",
                border: `1px solid ${currency === c ? "#e5202e" : "#1e1e1e"}`,
                background: currency === c ? "rgba(229,32,46,.1)" : "transparent",
                color: currency === c ? "#f5f5f5" : "#666",
                fontFamily: "'Barlow', sans-serif", fontWeight: 800,
                fontSize: ".82rem", letterSpacing: 2, cursor: "pointer",
              }}>
              {CURRENCY_SYMBOLS[c]} {c}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "1rem", padding: ".75rem 1rem", background: "#111", border: "1px solid #1e1e1e", fontSize: ".78rem", color: "#666" }}>
          ⚠ UPI and Cash on Delivery are only available when currency is set to <strong style={{ color: "#f5f5f5" }}>INR</strong>.
          Customers using those payment methods with a non-INR currency will see a currency mismatch error.
        </div>
      </div>

      {/* ── Shipping ───────────────────────────────────────────────────── */}
      <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.75rem", maxWidth: 720, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>🚚</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".9rem", letterSpacing: 1 }}>SHIPPING CONFIGURATION</div>
            <div style={{ color: "#555", fontSize: ".78rem", marginTop: ".2rem" }}>
              Set free shipping threshold, default flat rate, and per-country overrides.
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontSize: ".7rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".4rem" }}>
              Free Shipping Threshold ({sym})
            </label>
            <input
              type="number" min={0} value={shippingFreeThreshold}
              onChange={e => setShippingFreeThreshold(parseFloat(e.target.value) || 0)}
              style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".65rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".88rem", outline: "none" }}
            />
            <div style={{ fontSize: ".68rem", color: "#444", marginTop: ".3rem" }}>Orders above this amount ship free</div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: ".7rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".4rem" }}>
              Default Flat Rate ({sym})
            </label>
            <input
              type="number" min={0} value={shippingFlatRate}
              onChange={e => setShippingFlatRate(parseFloat(e.target.value) || 0)}
              style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".65rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".88rem", outline: "none" }}
            />
            <div style={{ fontSize: ".68rem", color: "#444", marginTop: ".3rem" }}>Applied when order is below threshold</div>
          </div>
        </div>

        {/* Per-country rates */}
        <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".75rem" }}>
          Per-Country Shipping Rates
        </div>

        {countryRates.length > 0 && (
          <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "6px" }}>
            {countryRates.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: ".75rem", background: "#111", border: "1px solid #1e1e1e", padding: ".6rem 1rem" }}>
                <span style={{ flex: 1, fontSize: ".82rem", color: "#c8c8c8" }}>{r.country}</span>
                <span style={{ fontWeight: 700, fontSize: ".82rem", color: "#e5202e" }}>{sym}{r.rate}</span>
                <button onClick={() => removeCountryRate(i)}
                  style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: ".85rem", transition: "color .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#e5202e")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#555")}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <select value={newCountry} onChange={e => setNewCountry(e.target.value)}
            style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".6rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".82rem", outline: "none", minWidth: 160 }}>
            {COUNTRIES.map(c => <option key={c} style={{ background: "#111" }}>{c}</option>)}
          </select>
          <input
            type="number" min={0} placeholder={`Rate (${sym})`} value={newCountryRate}
            onChange={e => setNewCountryRate(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCountryRate()}
            style={{ width: 120, background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".6rem .75rem", fontFamily: "'Barlow', sans-serif", fontSize: ".82rem", outline: "none" }}
          />
          <button onClick={addCountryRate} disabled={!newCountryRate.trim()}
            style={{ background: !newCountryRate.trim() ? "#1e1e1e" : "#e5202e", color: !newCountryRate.trim() ? "#444" : "#fff", border: "none", padding: ".6rem 1.25rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".75rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: !newCountryRate.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
            + ADD
          </button>
        </div>
        <div style={{ fontSize: ".7rem", color: "#444", marginTop: ".5rem" }}>
          Country-specific rates override the default flat rate above. Set rate to 0 for free shipping to a country.
        </div>
      </div>

      {/* ── Tax Rate ───────────────────────────────────────────────────── */}
      <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.75rem", maxWidth: 720, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>🧾</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".9rem", letterSpacing: 1 }}>TAX RATE</div>
            <div style={{ color: "#555", fontSize: ".78rem", marginTop: ".2rem" }}>Applied to order subtotals at checkout.</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <input
            type="number" min={0} max={100} step={0.5} value={taxRate}
            onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
            style={{ width: 120, background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".65rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".88rem", outline: "none" }}
          />
          <span style={{ color: "#888", fontSize: ".9rem", fontWeight: 700 }}>%</span>
          <span style={{ color: "#555", fontSize: ".78rem" }}>Currently: {taxRate}% tax applied at checkout</span>
        </div>
      </div>

      {/* ── Promo Banner ───────────────────────────────────────────────── */}
      <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.75rem", maxWidth: 720, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>📢</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".9rem", letterSpacing: 1 }}>PROMO BANNER MESSAGES</div>
            <div style={{ color: "#555", fontSize: ".78rem", marginTop: ".2rem" }}>These messages scroll across the red banner at the top of the storefront. Max 20 messages, 200 chars each.</div>
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          {messages.length === 0 ? (
            <div style={{ color: "#444", fontSize: ".82rem", padding: "1.5rem", textAlign: "center", border: "1px dashed #222" }}>
              No messages. Add one below.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: ".5rem", background: "#111", border: "1px solid #1e1e1e", padding: ".65rem 1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0 }}>
                    <button onClick={() => moveUp(i)} disabled={i === 0}
                      style={{ background: "none", border: "none", color: i === 0 ? "#222" : "#555", cursor: i === 0 ? "default" : "pointer", fontSize: ".7rem", lineHeight: 1, padding: "1px 3px" }}>▲</button>
                    <button onClick={() => moveDown(i)} disabled={i === messages.length - 1}
                      style={{ background: "none", border: "none", color: i === messages.length - 1 ? "#222" : "#555", cursor: i === messages.length - 1 ? "default" : "pointer", fontSize: ".7rem", lineHeight: 1, padding: "1px 3px" }}>▼</button>
                  </div>
                  <span style={{ flex: 1, fontSize: ".82rem", color: "#c8c8c8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</span>
                  <button onClick={() => removeMessage(i)}
                    style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: ".85rem", flexShrink: 0, transition: "color .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#e5202e")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#555")}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.5rem" }}>
          <input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addMessage()}
            placeholder="Type a new message… e.g. 🔥 SALE UP TO 40% OFF"
            maxLength={200}
            style={{ flex: 1, background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif", fontSize: ".85rem", padding: ".7rem 1rem", outline: "none" }}
          />
          <button onClick={addMessage} disabled={!newMsg.trim() || messages.length >= 20}
            style={{ background: (!newMsg.trim() || messages.length >= 20) ? "#1e1e1e" : "#e5202e", color: (!newMsg.trim() || messages.length >= 20) ? "#444" : "#fff", border: "none", padding: ".7rem 1.25rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".75rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: (!newMsg.trim() || messages.length >= 20) ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
            + ADD
          </button>
        </div>
      </div>

      {/* ── Save button ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 720, display: "flex", alignItems: "center", gap: "1rem" }}>
        <button onClick={saveSettings} disabled={saving}
          style={{ background: saving ? "#1e1e1e" : "#f5f5f5", color: saving ? "#555" : "#0a0a0a", border: "none", padding: ".8rem 2.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".8rem", letterSpacing: 2, textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", transition: "all .2s" }}
          onMouseEnter={e => { if (!saving) { (e.currentTarget as HTMLElement).style.background = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#fff" } }}
          onMouseLeave={e => { if (!saving) { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; (e.currentTarget as HTMLElement).style.color = "#0a0a0a" } }}>
          {saving ? "SAVING…" : "SAVE ALL SETTINGS"}
        </button>
        {feedback && (
          <span style={{ fontSize: ".82rem", fontWeight: 600, color: feedback.startsWith("✓") ? "#22c55e" : "#e5202e" }}>
            {feedback}
          </span>
        )}
      </div>

      {/* ── Banner preview ─────────────────────────────────────────────── */}
      {messages.length > 0 && (
        <div style={{ marginTop: "2rem", maxWidth: 720 }}>
          <div style={{ fontWeight: 800, fontSize: ".75rem", letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".75rem" }}>BANNER PREVIEW</div>
          <div style={{ background: "#e5202e", color: "#fff", height: 36, overflow: "hidden", display: "flex", alignItems: "center", position: "relative" }}>
            <div style={{ display: "flex", animation: "ticker 28s linear infinite", whiteSpace: "nowrap", willChange: "transform" }}>
              {[...messages, ...messages].map((msg, i) => (
                <span key={i} style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "0 3rem" }}>{msg}</span>
              ))}
            </div>
            <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
          </div>
        </div>
      )}
    </div>
  )
}
