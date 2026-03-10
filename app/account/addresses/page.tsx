"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Address = {
  _id: string; label: string; name: string; phone: string
  address: string; city: string; state: string; zip: string; country: string; isDefault: boolean
}

const INP: React.CSSProperties = { width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".65rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".85rem", outline: "none", boxSizing: "border-box" }
const LABEL: React.CSSProperties = { display: "block", fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".35rem" }
const EMPTY: Omit<Address, "_id"> = { label: "Home", name: "", phone: "", address: "", city: "", state: "", zip: "", country: "India", isDefault: false }

function getCustomer() {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem("trident_customer") || "null") } catch { return null }
}

export default function AddressesPage() {
  const router = useRouter()
  const [addrs,   setAddrs]   = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<string | null>(null)
  const [form,    setForm]     = useState<Omit<Address,"_id">>(EMPTY)
  const [saving,  setSaving]   = useState(false)
  const [toast,   setToast]    = useState("")

  const customer = getCustomer()

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000) }

  useEffect(() => {
    if (!customer) { router.replace("/signin?redirect=/account/addresses"); return }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/addresses", { headers: { "x-customer-email": customer.email } })
      const j = await r.json()
      setAddrs(j.success ? j.data : [])
    } catch { setAddrs([]) }
    setLoading(false)
  }

  function startNew() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function startEdit(a: Address) { setEditing(a._id); setForm({ label: a.label, name: a.name, phone: a.phone, address: a.address, city: a.city, state: a.state, zip: a.zip, country: a.country, isDefault: a.isDefault }); setShowForm(true) }
  function setF(k: keyof typeof EMPTY, v: string | boolean) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.name || !form.address || !form.city) return
    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/addresses/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json", "x-customer-email": customer.email }, body: JSON.stringify(form) })
      } else {
        await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json", "x-customer-email": customer.email }, body: JSON.stringify(form) })
      }
      showToast(editing ? "Address updated." : "Address saved.")
      setShowForm(false)
      load()
    } catch { showToast("Failed to save.") }
    setSaving(false)
  }

  async function del(id: string) {
    if (!confirm("Delete this address?")) return
    await fetch(`/api/addresses/${id}`, { method: "DELETE", headers: { "x-customer-email": customer.email } })
    setAddrs(prev => prev.filter(a => a._id !== id))
    showToast("Deleted.")
  }

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", right: "2rem", background: "#22c55e", color: "#fff", padding: ".85rem 1.5rem", fontWeight: 700, fontSize: ".82rem", letterSpacing: 1, zIndex: 9999 }}>{toast}</div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", letterSpacing: 3 }}>
          SAVED <span style={{ color: "#e5202e" }}>ADDRESSES</span>
        </h1>
        {!showForm && addrs.length < 5 && (
          <button onClick={startNew}
            style={{ background: "#e5202e", color: "#fff", border: "none", padding: ".6rem 1.25rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".72rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
            + ADD ADDRESS
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.75rem", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: 2, marginBottom: "1.5rem" }}>
            {editing ? "EDIT ADDRESS" : "NEW ADDRESS"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={LABEL}>Label</label>
              <select value={form.label} onChange={e => setF("label", e.target.value)} style={{ ...INP, appearance: "none" }}>
                {["Home","Work","Other"].map(l => <option key={l} style={{ background: "#111" }}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Full Name *</label>
              <input value={form.name} onChange={e => setF("name", e.target.value)} style={INP} placeholder="John Doe" />
            </div>
            <div>
              <label style={LABEL}>Phone</label>
              <input value={form.phone} onChange={e => setF("phone", e.target.value)} style={INP} placeholder="+91 98765 43210" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={LABEL}>Address *</label>
              <input value={form.address} onChange={e => setF("address", e.target.value)} style={INP} placeholder="123 Main Street, Apt 4B" />
            </div>
            <div>
              <label style={LABEL}>City *</label>
              <input value={form.city} onChange={e => setF("city", e.target.value)} style={INP} placeholder="Chennai" />
            </div>
            <div>
              <label style={LABEL}>State</label>
              <input value={form.state} onChange={e => setF("state", e.target.value)} style={INP} placeholder="Tamil Nadu" />
            </div>
            <div>
              <label style={LABEL}>PIN Code</label>
              <input value={form.zip} onChange={e => setF("zip", e.target.value)} style={INP} placeholder="600001" />
            </div>
            <div>
              <label style={LABEL}>Country</label>
              <select value={form.country} onChange={e => setF("country", e.target.value)} style={{ ...INP, appearance: "none" }}>
                {["India","United States","United Kingdom","Singapore","UAE","Australia"].map(c => <option key={c} style={{ background: "#111" }}>{c}</option>)}
              </select>
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: ".6rem", marginTop: "1rem", cursor: "pointer" }}>
            <input type="checkbox" checked={form.isDefault} onChange={e => setF("isDefault", e.target.checked)} style={{ accentColor: "#e5202e" }} />
            <span style={{ fontSize: ".75rem", color: "#666" }}>Set as default address</span>
          </label>
          <div style={{ display: "flex", gap: ".75rem", marginTop: "1.5rem" }}>
            <button onClick={save} disabled={saving || !form.name || !form.address || !form.city}
              style={{ background: "#e5202e", color: "#fff", border: "none", padding: ".75rem 1.75rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
              {saving ? "SAVING…" : editing ? "UPDATE" : "SAVE ADDRESS"}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#555", padding: ".75rem 1.25rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".78rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Address list */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#555" }}>Loading…</div>
      ) : addrs.length === 0 && !showForm ? (
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📍</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 2, marginBottom: ".5rem" }}>NO SAVED ADDRESSES</div>
          <p style={{ color: "#555", fontSize: ".88rem", marginBottom: "1.5rem" }}>Add your shipping addresses for faster checkout.</p>
          <button onClick={startNew}
            style={{ display: "inline-block", background: "#e5202e", color: "#fff", border: "none", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
            + ADD ADDRESS
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1px", background: "#1e1e1e" }}>
          {addrs.map(a => (
            <div key={a._id} style={{ background: "#0d0d0d", padding: "1.5rem", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".75rem" }}>
                <span style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", background: "#1e1e1e", color: "#888", padding: ".25rem .65rem" }}>{a.label}</span>
                {a.isDefault && <span style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", background: "rgba(229,32,46,.15)", color: "#e5202e", padding: ".25rem .65rem" }}>DEFAULT</span>}
              </div>
              <div style={{ fontWeight: 700, marginBottom: ".25rem" }}>{a.name}</div>
              {a.phone && <div style={{ color: "#555", fontSize: ".78rem", marginBottom: ".15rem" }}>{a.phone}</div>}
              <div style={{ color: "#666", fontSize: ".82rem", lineHeight: 1.6 }}>
                {a.address}<br />{a.city}, {a.state} {a.zip}<br />{a.country}
              </div>
              <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
                <button onClick={() => startEdit(a)}
                  style={{ flex: 1, background: "transparent", border: "1px solid #1e1e1e", color: "#555", padding: ".45rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".65rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                  EDIT
                </button>
                <button onClick={() => del(a._id)}
                  style={{ flex: 1, background: "rgba(229,32,46,.08)", border: "1px solid rgba(229,32,46,.25)", color: "#e5202e", padding: ".45rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".65rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
