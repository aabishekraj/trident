"use client"

import { useEffect, useState } from "react"
import { useAdminSession } from "@/context/AdminSessionContext"
import { ROLE_PERMISSIONS } from "@/lib/roles"

type CouponScope = "all" | "category" | "products"
type Coupon = {
  _id: string; code: string; discount: number; type: "percent" | "fixed"
  scope: CouponScope; categories?: string[]; productIds?: string[]
  minOrderValue: number; maxUses: number; usedCount: number
  expiresAt: string; active: boolean; description: string
  validForOrderCount: number
}

const CATEGORIES = ["Men — T-Shirts","Men — Shirts","Men — Shorts","Men — Shoes","Women — T-Shirts","Women — Dresses","Women — Shoes","Kids — Clothing","Kids — Shoes"]
const INP: React.CSSProperties = { width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".7rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".88rem", outline: "none" }
const LBL: React.CSSProperties = { display: "block", fontSize: ".68rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".4rem" }

const EMPTY: Omit<Coupon,"_id"|"usedCount"> = {
  code: "", discount: 10, type: "percent", scope: "all",
  categories: [], productIds: [], minOrderValue: 0,
  maxUses: 100, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  active: true, description: "", validForOrderCount: 0,
}

export default function AdminCouponsPage() {
  const session   = useAdminSession()
  const perms     = ROLE_PERMISSIONS[session?.role ?? "analyst"]?.coupons
  const canCreate = perms?.create ?? false
  const canEdit   = perms?.edit   ?? false
  const canDelete = perms?.delete ?? false

  const [coupons, setCoupons]   = useState<Coupon[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState<Coupon | null>(null)
  const [form, setForm]         = useState<typeof EMPTY>(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState<{msg:string;ok:boolean}|null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/coupons")
      const j = await r.json()
      setCoupons(j.success ? j.data : [])
    } catch { setCoupons([]) }
    setLoading(false)
  }

  function setF(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })) }

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true) }
  function openEdit(c: Coupon) {
    setEditing(c)
    setForm({ code: c.code, discount: c.discount, type: c.type, scope: c.scope, categories: c.categories||[], productIds: c.productIds||[], minOrderValue: c.minOrderValue, maxUses: c.maxUses, expiresAt: c.expiresAt?.split("T")[0]||"", active: c.active, description: c.description, validForOrderCount: c.validForOrderCount||0 })
    setModal(true)
  }

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    setF("code", code)
  }

  async function save() {
    if (!form.code || !form.discount) return showToast("Code and discount are required.", false)
    setSaving(true)
    try {
      const url    = editing ? `/api/coupons/${editing._id}` : "/api/coupons"
      const method = editing ? "PUT" : "POST"
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const j = await r.json()
      if (j.success) { showToast(editing ? "Coupon updated!" : "Coupon created!"); setModal(false); load() }
      else showToast(j.error || "Failed.", false)
    } catch { showToast("Error.", false) }
    setSaving(false)
  }

  async function toggleActive(c: Coupon) {
    try {
      await fetch(`/api/coupons/${c._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !c.active }) })
      load(); showToast(`Coupon ${!c.active ? "activated" : "deactivated"}.`)
    } catch { showToast("Failed.", false) }
  }

  async function deleteCoupon(id: string, code: string) {
    if (!confirm(`Delete coupon "${code}"?`)) return
    try {
      await fetch(`/api/coupons/${id}`, { method: "DELETE" })
      showToast("Deleted."); load()
    } catch { showToast("Failed.", false) }
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function bulkDelete(all: boolean) {
    const count = all ? coupons.length : selected.size
    if (!count) return
    if (!confirm(all ? `Delete ALL ${count} coupons? This cannot be undone.` : `Delete ${count} selected coupon${count > 1 ? "s" : ""}?`)) return
    setBulkDeleting(true)
    try {
      const body = all ? { all: true } : { ids: Array.from(selected) }
      const r = await fetch("/api/coupons", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const j = await r.json()
      if (j.success) { showToast(`Deleted ${j.deleted} coupon${j.deleted !== 1 ? "s" : ""}.`); setSelected(new Set()); load() }
      else showToast(j.error || "Failed.", false)
    } catch { showToast("Error.", false) }
    setBulkDeleting(false)
  }

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  function isExpired(d: string) { return d && new Date(d) < new Date() }

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2 }}>
          COU<span style={{ color: "#e5202e" }}>PONS</span>
        </h1>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
          {selected.size > 0 && canDelete && (
            <>
              <span style={{ fontSize: ".75rem", color: "#888", fontWeight: 700 }}>{selected.size} selected</span>
              <button onClick={() => setSelected(new Set())}
                style={{ background: "transparent", border: "1px solid #333", color: "#666", padding: ".4rem .85rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".7rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>CLEAR</button>
              <button onClick={() => bulkDelete(false)} disabled={bulkDeleting}
                style={{ background: "rgba(229,32,46,.12)", border: "1px solid #e5202e", color: "#e5202e", padding: ".4rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".7rem", letterSpacing: 1, textTransform: "uppercase", cursor: bulkDeleting ? "not-allowed" : "pointer" }}>
                {bulkDeleting ? "DELETING…" : `🗑 DELETE ${selected.size}`}
              </button>
            </>
          )}
          {canDelete && coupons.length > 0 && (
            <button onClick={() => bulkDelete(true)} disabled={bulkDeleting}
              style={{ background: "transparent", border: "1px solid #333", color: "#555", padding: ".4rem .85rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".7rem", letterSpacing: 1, textTransform: "uppercase", cursor: bulkDeleting ? "not-allowed" : "pointer" }}>
              DELETE ALL
            </button>
          )}
          {canDelete && coupons.length > 0 && (
            <button onClick={() => selected.size === coupons.length ? setSelected(new Set()) : setSelected(new Set(coupons.map(c => c._id)))}
              style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#555", padding: ".4rem .85rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".7rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
              {selected.size === coupons.length && coupons.length > 0 ? "✓ ALL" : "SELECT ALL"}
            </button>
          )}
          {canCreate && (
            <button onClick={openAdd} style={{ background: "#e5202e", color: "#fff", border: "none", padding: ".55rem 1.3rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
              + CREATE COUPON
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "1px", background: "#1e1e1e", marginBottom: "2rem" }}>
        {[
          ["Total", coupons.length, "#f5f5f5"],
          ["Active", coupons.filter(c => c.active && !isExpired(c.expiresAt)).length, "#22c55e"],
          ["Expired", coupons.filter(c => isExpired(c.expiresAt)).length, "#e5202e"],
          ["Uses Today", coupons.reduce((s, c) => s + (c.usedCount||0), 0), "#eab308"],
        ].map(([l, v, col]) => (
          <div key={String(l)} style={{ flex: 1, background: "#0d0d0d", padding: "1.2rem 1.5rem" }}>
            <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".4rem" }}>{l}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: String(col) }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? <div style={{ textAlign: "center", padding: "4rem", color: "#555" }}>Loading…</div> : (
        <div style={{ border: "1px solid #1e1e1e" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {canDelete && <th style={{ padding: ".85rem .75rem", borderBottom: "1px solid #1e1e1e", width: 36 }} />}
              {["Code","Discount","Scope","Min Order","Valid For Order #","Uses","Expires","Status","Actions"].map(h => (
                  <th key={h} style={{ padding: ".85rem 1.2rem", textAlign: "left", fontSize: ".68rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", borderBottom: "1px solid #1e1e1e" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "#555" }}>No coupons yet. Create your first one!</td></tr>
              ) : coupons.map(c => {
                const expired = isExpired(c.expiresAt)
                return (
                  <tr key={c._id} style={{ borderBottom: "1px solid #0f0f0f" }}>
                    {canDelete && (
                      <td style={{ padding: ".9rem .75rem" }}>
                        <div onClick={() => toggleSelect(c._id)}
                          style={{ width: 18, height: 18, background: selected.has(c._id) ? "#e5202e" : "transparent", border: `2px solid ${selected.has(c._id) ? "#e5202e" : "#333"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", color: "#fff", fontWeight: 900, cursor: "pointer" }}>
                          {selected.has(c._id) ? "✓" : ""}
                        </div>
                      </td>
                    )}
                    <td style={{ padding: ".9rem 1.2rem" }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.1rem", letterSpacing: 2, color: c.active && !expired ? "#f5f5f5" : "#555" }}>{c.code}</div>
                      {c.description && <div style={{ color: "#555", fontSize: ".72rem", marginTop: ".2rem" }}>{c.description}</div>}
                    </td>
                    <td style={{ padding: ".9rem 1.2rem" }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", color: "#e5202e" }}>
                        {c.discount}{c.type === "percent" ? "%" : "$"}
                      </span>
                      <span style={{ color: "#555", fontSize: ".72rem", display: "block" }}>{c.type === "percent" ? "percent off" : "fixed off"}</span>
                    </td>
                    <td style={{ padding: ".9rem 1.2rem" }}>
                      <span style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#888" }}>
                        {c.scope === "all" ? "🌐 All Products" : c.scope === "category" ? `📂 ${c.categories?.join(", ")}` : "📦 Selected"}
                      </span>
                    </td>
                    <td style={{ padding: ".9rem 1.2rem", color: "#888", fontSize: ".85rem" }}>
                      {c.minOrderValue > 0 ? `$${c.minOrderValue}` : "—"}
                    </td>
                    <td style={{ padding: ".9rem 1.2rem" }}>
                      <span style={{ fontSize: ".85rem", color: c.validForOrderCount > 0 ? "#a855f7" : "#555" }}>
                        {c.validForOrderCount > 0 ? `#${c.validForOrderCount} only` : "Any"}
                      </span>
                    </td>
                    <td style={{ padding: ".9rem 1.2rem" }}>
                      <span style={{ fontSize: ".85rem", color: "#888" }}>{c.usedCount || 0}</span>
                      <span style={{ color: "#444", fontSize: ".72rem" }}> / {c.maxUses}</span>
                    </td>
                    <td style={{ padding: ".9rem 1.2rem" }}>
                      <span style={{ fontSize: ".82rem", color: expired ? "#e5202e" : "#888" }}>
                        {expired ? "⚠ Expired" : c.expiresAt?.split("T")[0]}
                      </span>
                    </td>
                    <td style={{ padding: ".9rem 1.2rem" }}>
                      <span style={{ display: "inline-block", padding: ".25rem .75rem", fontSize: ".65rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", background: (!c.active || expired) ? "rgba(229,32,46,.15)" : "rgba(34,197,94,.15)", color: (!c.active || expired) ? "#e5202e" : "#22c55e" }}>
                        {expired ? "Expired" : c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: ".9rem 1.2rem" }}>
                      <div style={{ display: "flex", gap: ".4rem" }}>
                        {canEdit && (
                          <button onClick={() => openEdit(c)} style={{ background: "rgba(59,130,246,.15)", color: "#3b82f6", border: "none", padding: ".3rem .65rem", fontSize: ".68rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>EDIT</button>
                        )}
                        {canEdit && (
                          <button onClick={() => toggleActive(c)} style={{ background: c.active ? "rgba(234,179,8,.15)" : "rgba(34,197,94,.15)", color: c.active ? "#eab308" : "#22c55e", border: "none", padding: ".3rem .65rem", fontSize: ".68rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                            {c.active ? "PAUSE" : "ENABLE"}
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => deleteCoupon(c._id, c.code)} style={{ background: "rgba(229,32,46,.12)", color: "#e5202e", border: "none", padding: ".3rem .65rem", fontSize: ".68rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>DEL</button>
                        )}
                        {!canEdit && !canDelete && <span style={{ color: "#444", fontSize: ".7rem" }}>View only</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL ── */}
      {modal && (
        <>
          <div onClick={() => setModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 2000 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#0d0d0d", border: "1px solid #1e1e1e", width: 580, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", zIndex: 2001 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem", borderBottom: "1px solid #1e1e1e" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2 }}>{editing ? "EDIT COUPON" : "CREATE COUPON"}</span>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "#f5f5f5", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>

              {/* Code */}
              <div>
                <label style={LBL}>Coupon Code *</label>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <input style={{ ...INP, flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}
                    value={form.code} onChange={e => setF("code", e.target.value.toUpperCase())} placeholder="TRIDENT20" />
                  <button onClick={generateCode} style={{ background: "#1e1e1e", color: "#888", border: "none", padding: "0 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" }}>AUTO GENERATE</button>
                </div>
              </div>

              {/* Description */}
              <div><label style={LBL}>Description (optional)</label><input style={INP} value={form.description} onChange={e => setF("description", e.target.value)} placeholder="Summer sale — 20% off everything" /></div>

              {/* Discount */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={LBL}>Discount Amount *</label>
                  <input style={INP} type="number" min={1} value={form.discount} onChange={e => setF("discount", parseFloat(e.target.value)||0)} />
                </div>
                <div>
                  <label style={LBL}>Discount Type</label>
                  <div style={{ display: "flex", gap: ".5rem" }}>
                    {[["percent","% Off"],["fixed","$ Off"]].map(([v,l]) => (
                      <label key={v} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: ".4rem", padding: ".7rem", border: `1px solid ${form.type === v ? "#e5202e" : "#1e1e1e"}`, cursor: "pointer", background: form.type === v ? "rgba(229,32,46,.08)" : "transparent" }}>
                        <input type="radio" name="type" value={v} checked={form.type === v} onChange={() => setF("type", v)} style={{ accentColor: "#e5202e" }} />
                        <span style={{ fontWeight: 700, fontSize: ".8rem", color: form.type === v ? "#e5202e" : "#555" }}>{l}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scope */}
              <div>
                <label style={LBL}>Apply To</label>
                <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
                  {([["all","🌐 All Products"],["category","📂 Category"],["products","📦 Selected Products"]] as [CouponScope,string][]).map(([v,l]) => (
                    <button key={v} onClick={() => setF("scope", v)} type="button"
                      style={{ flex: 1, padding: ".65rem .5rem", border: `1px solid ${form.scope === v ? "#e5202e" : "#1e1e1e"}`, background: form.scope === v ? "rgba(229,32,46,.08)" : "transparent", color: form.scope === v ? "#e5202e" : "#555", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                      {l}
                    </button>
                  ))}
                </div>
                {form.scope === "category" && (
                  <div>
                    <label style={LBL}>Select Categories</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
                      {CATEGORIES.map(cat => {
                        const sel = form.categories?.includes(cat)
                        return (
                          <button key={cat} type="button" onClick={() => setF("categories", sel ? form.categories?.filter(c => c !== cat) : [...(form.categories||[]), cat])}
                            style={{ padding: ".3rem .8rem", border: `1px solid ${sel ? "#e5202e" : "#1e1e1e"}`, background: sel ? "rgba(229,32,46,.08)" : "transparent", color: sel ? "#e5202e" : "#555", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: ".72rem", cursor: "pointer" }}>
                            {cat}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {form.scope === "products" && (
                  <div style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", padding: "1rem", color: "#666", fontSize: ".82rem" }}>
                    Product picker coming soon. Paste product IDs below:<br />
                    <input style={{ ...INP, marginTop: ".5rem" }} placeholder="id1, id2, id3…" value={form.productIds?.join(", ")||""} onChange={e => setF("productIds", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
                  </div>
                )}
              </div>

              {/* Limits */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div><label style={LBL}>Min Order ($)</label><input style={INP} type="number" min={0} value={form.minOrderValue} onChange={e => setF("minOrderValue", parseFloat(e.target.value)||0)} /></div>
                <div><label style={LBL}>Max Uses</label><input style={INP} type="number" min={1} value={form.maxUses} onChange={e => setF("maxUses", parseInt(e.target.value)||100)} /></div>
                <div><label style={LBL}>Expires On</label><input style={{ ...INP, colorScheme: "dark" }} type="date" value={form.expiresAt} onChange={e => setF("expiresAt", e.target.value)} /></div>
              </div>

              {/* Order count restriction */}
              <div>
                <label style={LBL}>Valid for Customer's Order # (0 = any order)</label>
                <input style={INP} type="number" min={0} value={form.validForOrderCount}
                  onChange={e => setF("validForOrderCount", parseInt(e.target.value)||0)}
                  placeholder="0 = valid for all orders, 1 = first order only, 2 = second order…" />
                {form.validForOrderCount > 0 && (
                  <div style={{ fontSize: ".72rem", color: "#a855f7", marginTop: ".4rem" }}>
                    This coupon will only work when the customer is placing their #{form.validForOrderCount} order.
                  </div>
                )}
              </div>

              {/* Active toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: ".75rem", cursor: "pointer" }}>
                <input type="checkbox" checked={form.active} onChange={e => setF("active", e.target.checked)} style={{ accentColor: "#e5202e", width: 16, height: 16 }} />
                <span style={{ fontWeight: 700, fontSize: ".82rem" }}>Coupon is Active</span>
              </label>

              {/* Preview */}
              <div style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 4, color: "#e5202e" }}>{form.code || "CODE"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: ".88rem" }}>{form.discount}{form.type === "percent" ? "% OFF" : "$ OFF"} {form.scope === "all" ? "everything" : form.scope === "category" ? form.categories?.join(", ") : "selected items"}</div>
                  <div style={{ color: "#555", fontSize: ".75rem", marginTop: ".2rem" }}>
                    {form.minOrderValue > 0 && `Min order $${form.minOrderValue} · `}Max {form.maxUses} uses · Expires {form.expiresAt}
                    {form.validForOrderCount > 0 && ` · Order #${form.validForOrderCount} only`}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", padding: "1.5rem", borderTop: "1px solid #1e1e1e" }}>
              <button onClick={() => setModal(false)} style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#888", padding: ".65rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".78rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>CANCEL</button>
              <button onClick={save} disabled={saving} style={{ background: saving ? "#333" : "#e5202e", color: "#fff", border: "none", padding: ".65rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "SAVING…" : editing ? "UPDATE COUPON" : "CREATE COUPON"}
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", right: "2rem", background: "#111", borderLeft: `3px solid ${toast.ok ? "#22c55e" : "#e5202e"}`, border: "1px solid #1e1e1e", padding: "1rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontSize: ".85rem", fontWeight: 700, zIndex: 3000, color: "#f5f5f5" }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
