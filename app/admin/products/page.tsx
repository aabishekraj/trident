"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useAdminSession } from "@/context/AdminSessionContext"
import { ROLE_PERMISSIONS } from "@/lib/roles"
import { useCurrency } from "@/context/CurrencyContext"

type StockStatus = "active" | "sold_out" | "coming_soon"
type Product = {
  _id: string; name: string; description: string; price: number
  category: string; tag: string; sizes: string[]; image: string; images: string[]
  stockStatus: StockStatus; active: boolean; featured?: boolean
}

const CATEGORIES = [
  "Men — T-Shirts","Men — Shirts","Men — Polo Shirts","Men — Hoodies","Men — Shorts","Men — Shoes","Men — Jackets","Men — Tracksuits","Men — Accessories",
  "Women — T-Shirts","Women — Crop Tops","Women — Sports Bra","Women — Dresses","Women — Yoga Pants","Women — Shorts","Women — Shoes","Women — Jackets","Women — Activewear","Women — Accessories",
  "Kids — Clothing","Kids — Shoes","Kids — Accessories",
  "Unisex",
]
const SIZE_PRESETS = {
  Clothing: ["XS","S","M","L","XL","XXL","3XL"],
  Shoes:    ["UK 6","UK 7","UK 8","UK 9","UK 10","UK 11","UK 12"],
  Kids:     ["2Y","4Y","6Y","8Y","10Y","12Y","14Y"],
}
const TAGS = ["", "NEW", "HOT", "SALE", "EXCLUSIVE", "LIMITED", "BESTSELLER"]

const INP: React.CSSProperties = { width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".7rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".88rem", outline: "none" }
const LBL: React.CSSProperties = { display: "block", fontSize: ".68rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".4rem" }

const EMPTY: Omit<Product, "_id"> = { name: "", description: "", price: 0, category: CATEGORIES[0], tag: "", sizes: [], image: "", images: [], stockStatus: "active", active: true, featured: false }

export default function AdminProductsPage() {
  const session  = useAdminSession()
  const { symbol, fmt } = useCurrency()
  const perms    = ROLE_PERMISSIONS[session?.role ?? "analyst"]?.products
  const canCreate    = perms?.create ?? false
  const canEdit      = perms?.edit   ?? false
  const canDelete    = perms?.delete ?? false
  const canBulkImport = perms?.bulkImport ?? false

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState<Product | null>(null)
  const [form, setForm]         = useState<Omit<Product,"_id">>(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<{msg:string;ok:boolean}|null>(null)
  const [search, setSearch]         = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [bulkUploading, setBulkUploading] = useState(false)
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileRef       = useRef<HTMLInputElement>(null)
  const multiImgRef   = useRef<HTMLInputElement>(null)
  const csvFileRef    = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/products")
      const j = await r.json()
      setProducts(Array.isArray(j) ? j : j.data || [])
    } catch { setProducts([]) }
    setLoading(false)
  }

  function openAdd()  { setEditing(null); setForm(EMPTY); setModal(true) }
  function openEdit(p: Product) { setEditing(p); setForm({ name: p.name, description: p.description, price: p.price, category: p.category, tag: p.tag || "", sizes: p.sizes || [], image: p.image || "", images: p.images || [], stockStatus: p.stockStatus || "active", active: p.active !== false, featured: p.featured || false }); setModal(true) }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function selectAll()   { setSelected(new Set(filtered.map(p => p._id))) }
  function deselectAll() { setSelected(new Set()) }

  async function bulkDelete() {
    if (!selected.size || !confirm(`Delete ${selected.size} selected product${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return
    setBulkDeleting(true)
    try {
      const r = await fetch("/api/products/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected) }) })
      const j = await r.json()
      if (j.success) { showToast(`Deleted ${j.deleted} products.`); setSelected(new Set()); load() }
      else showToast(j.error || "Failed.", false)
    } catch { showToast("Error.", false) }
    setBulkDeleting(false)
  }

  async function quickFeatured(id: string, featured: boolean) {
    try {
      await fetch(`/api/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ featured }) })
      setProducts(prev => prev.map(p => p._id === id ? { ...p, featured } : p))
      showToast(featured ? "📌 Pinned to homepage!" : "Unpinned from homepage.")
    } catch { showToast("Failed.", false) }
  }

  function setF(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })) }

  function toggleSize(s: string) {
    setForm(f => ({ ...f, sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s] }))
  }

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const j = await res.json()
      if (j.success) return j.path as string
      showToast(j.error || "Upload failed.", false)
      return null
    } catch { showToast("Upload error.", false); return null }
  }

  async function handleImageUpload(file: File) {
    setUploadingImg(true)
    const path = await uploadFile(file)
    if (path) setF("image", path)
    setUploadingImg(false)
  }

  async function handleAdditionalImages(files: FileList) {
    setUploadingImg(true)
    const paths: string[] = []
    for (const file of Array.from(files)) {
      const path = await uploadFile(file)
      if (path) paths.push(path)
    }
    if (paths.length) setForm(f => ({ ...f, images: [...(f.images || []), ...paths] }))
    setUploadingImg(false)
  }

  function removeAdditionalImage(idx: number) {
    setForm(f => ({ ...f, images: (f.images || []).filter((_, i) => i !== idx) }))
  }

  // ── CSV Bulk Upload ─────────────────────────────────────────────────────────
  // Expected CSV columns: name,price,description,category,tag,sizes,image,stockStatus
  function handleCsvUpload(file: File) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      const lines = text.trim().split("\n")
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase())

      const rows = lines.slice(1).map(line => {
        // Handle quoted CSV values correctly
        const values: string[] = []
        let current = ""
        let inQuote = false
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '"') { inQuote = !inQuote }
          else if (line[i] === "," && !inQuote) { values.push(current.trim()); current = "" }
          else { current += line[i] }
        }
        values.push(current.trim())

        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = (values[i] || "").replace(/^"|"$/g, "").trim() })
        return obj
      }).filter(r => r.name && r.price)

      if (!rows.length) { showToast("No valid rows found in CSV.", false); return }

      setBulkUploading(true)
      try {
        const res = await fetch("/api/products/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rows),
        })
        const j = await res.json()
        if (j.success) {
          showToast(`✓ ${j.created} products imported!`)
          load()
        } else {
          showToast(j.error || "Import failed.", false)
        }
      } catch { showToast("Upload error.", false) }
      setBulkUploading(false)
      if (csvFileRef.current) csvFileRef.current.value = ""
    }
    reader.readAsText(file)
  }

  function downloadCsvTemplate() {
    const header = "name,price,description,category,tag,sizes,image,images,stockStatus"
    const example = `"Air Flux Pro",189,"Premium running shoe","Men — Shoes","NEW","UK 8|UK 9|UK 10","https://example.com/main.jpg","https://example.com/alt1.jpg|https://example.com/alt2.jpg","active"`
    const blob = new Blob([header + "\n" + example], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "trident_products_template.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  async function save() {
    if (!form.name || !form.price) return showToast("Name and price are required.", false)
    setSaving(true)
    try {
      const url  = editing ? `/api/products/${editing._id}` : "/api/products"
      const method = editing ? "PUT" : "POST"
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const j = await r.json()
      if (j.success || j._id) { showToast(editing ? "Product updated!" : "Product added!"); setModal(false); load() }
      else showToast(j.error || "Failed.", false)
    } catch { showToast("Error saving.", false) }
    setSaving(false)
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      const r = await fetch(`/api/products/${id}`, { method: "DELETE" })
      const j = await r.json()
      if (j.success) { showToast("Deleted."); load() }
    } catch { showToast("Delete failed.", false) }
  }

  async function quickStatus(id: string, status: StockStatus) {
    try {
      await fetch(`/api/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stockStatus: status }) })
      load()
      showToast("Status updated!")
    } catch { showToast("Failed.", false) }
  }

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    const matchS = !filterStatus || p.stockStatus === filterStatus
    return matchQ && matchS
  })

  const activeSizes = form.category.toLowerCase().includes("shoe") ? SIZE_PRESETS.Shoes : form.category.toLowerCase().includes("kids") ? SIZE_PRESETS.Kids : SIZE_PRESETS.Clothing

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2 }}>
          PROD<span style={{ color: "#e5202e" }}>UCTS</span>
        </h1>
        <div style={{ display: "flex", gap: ".6rem" }}>
          <a href="/api/products/export" download
            style={{ background: "transparent", color: "#555", border: "1px solid #1e1e1e", padding: ".55rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            ↓ EXPORT
          </a>
          <button onClick={downloadCsvTemplate} title="Download CSV template"
            style={{ background: "transparent", color: "#555", border: "1px solid #1e1e1e", padding: ".55rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
            CSV TEMPLATE
          </button>
          {canBulkImport && (
            <>
              <button onClick={() => csvFileRef.current?.click()} disabled={bulkUploading}
                style={{ background: bulkUploading ? "#333" : "transparent", color: bulkUploading ? "#666" : "#e5202e", border: "1px solid #e5202e", padding: ".55rem 1.1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: bulkUploading ? "not-allowed" : "pointer" }}>
                {bulkUploading ? "IMPORTING…" : "⬆ BULK IMPORT"}
              </button>
              <input ref={csvFileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvUpload(f) }} />
            </>
          )}
          {canCreate && (
            <button onClick={openAdd} style={{ background: "#e5202e", color: "#fff", border: "none", padding: ".55rem 1.3rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
              + ADD PRODUCT
            </button>
          )}
        </div>
      </div>

      {/* Filters + bulk actions */}
      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...INP, width: 240, padding: ".55rem 1rem" }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ ...INP, width: 160, padding: ".55rem 1rem", appearance: "none" }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="sold_out">Sold Out</option>
          <option value="coming_soon">Coming Soon</option>
        </select>
        <div style={{ color: "#555", fontSize: ".82rem" }}>{filtered.length} products</div>

        {/* Bulk selection controls */}
        {canDelete && filtered.length > 0 && (
          <div style={{ display: "flex", gap: ".5rem", marginLeft: "auto", alignItems: "center" }}>
            {selected.size > 0 && (
              <>
                <span style={{ fontSize: ".75rem", color: "#888", fontWeight: 700 }}>{selected.size} selected</span>
                <button onClick={deselectAll} style={{ background: "transparent", border: "1px solid #333", color: "#666", padding: ".35rem .75rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".7rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>CLEAR</button>
                <button onClick={bulkDelete} disabled={bulkDeleting}
                  style={{ background: bulkDeleting ? "#333" : "rgba(229,32,46,.15)", border: "1px solid #e5202e", color: "#e5202e", padding: ".35rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".7rem", letterSpacing: 1, textTransform: "uppercase", cursor: bulkDeleting ? "not-allowed" : "pointer" }}>
                  {bulkDeleting ? "DELETING…" : `🗑 DELETE ${selected.size}`}
                </button>
              </>
            )}
            <button onClick={selected.size === filtered.length ? deselectAll : selectAll}
              style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#555", padding: ".35rem .75rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".7rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
              {selected.size === filtered.length && filtered.length > 0 ? "✓ ALL" : "SELECT ALL"}
            </button>
          </div>
        )}
      </div>

      {/* Products grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#555" }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1px", background: "#1e1e1e" }}>
          {filtered.map(p => (
            <div key={p._id} style={{ background: "#0d0d0d", overflow: "hidden", outline: selected.has(p._id) ? "2px solid #e5202e" : p.featured ? "2px solid #eab308" : "none", position: "relative" }}>
              {/* Checkbox (top-left) */}
              {canDelete && (
                <div onClick={() => toggleSelect(p._id)} style={{ position: "absolute", top: "0.6rem", left: "0.6rem", zIndex: 10, cursor: "pointer" }}>
                  <div style={{ width: 20, height: 20, background: selected.has(p._id) ? "#e5202e" : "rgba(0,0,0,.7)", border: `2px solid ${selected.has(p._id) ? "#e5202e" : "#555"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", color: "#fff", fontWeight: 900 }}>
                    {selected.has(p._id) ? "✓" : ""}
                  </div>
                </div>
              )}
              {/* Featured badge */}
              {p.featured && (
                <div style={{ position: "absolute", top: "0.6rem", right: "0.6rem", zIndex: 10, background: "#eab308", color: "#000", fontSize: ".6rem", fontWeight: 900, letterSpacing: 1, padding: ".2rem .5rem" }}>📌 HOME</div>
              )}
              {/* Image */}
              <div style={{ position: "relative", height: 220, background: "#111" }}>
                {p.image ? (
                  <Image src={p.image.startsWith("http") ? p.image : p.image} alt={p.name} fill style={{ objectFit: "cover" }} unoptimized />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: "3rem" }}>📦</div>
                )}
                {/* Status overlay */}
                {p.stockStatus !== "active" && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", letterSpacing: 2, color: p.stockStatus === "sold_out" ? "#e5202e" : "#eab308" }}>
                      {p.stockStatus === "sold_out" ? "SOLD OUT" : "COMING SOON"}
                    </span>
                  </div>
                )}
                {p.tag && <span style={{ position: "absolute", top: "1rem", left: "1rem", background: "#e5202e", color: "#fff", fontSize: ".65rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: ".25rem .6rem" }}>{p.tag}</span>}
              </div>

              {/* Info */}
              <div style={{ padding: "1rem 1.2rem" }}>
                <div style={{ fontSize: ".7rem", color: "#555", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: ".25rem" }}>{p.category}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: ".25rem" }}>{p.name}</div>
                <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: ".6rem", color: "#f5f5f5" }}>{fmt(p.price)}</div>
                {p.sizes?.length > 0 && (
                  <div style={{ display: "flex", gap: ".25rem", flexWrap: "wrap", marginBottom: ".75rem" }}>
                    {p.sizes.map(s => <span key={s} style={{ border: "1px solid #1e1e1e", color: "#555", fontSize: ".62rem", fontWeight: 700, padding: ".15rem .4rem" }}>{s}</span>)}
                  </div>
                )}
                {/* Status quick-change — edit permission required */}
                {canEdit && (
                  <div style={{ display: "flex", gap: ".4rem", marginBottom: ".75rem", flexWrap: "wrap" }}>
                    {(["active","sold_out","coming_soon"] as StockStatus[]).map(st => (
                      <button key={st} onClick={() => quickStatus(p._id, st)}
                        style={{ padding: ".25rem .6rem", fontSize: ".62rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", border: "none", cursor: "pointer", background: p.stockStatus === st ? (st === "active" ? "rgba(34,197,94,.2)" : st === "sold_out" ? "rgba(229,32,46,.2)" : "rgba(234,179,8,.2)") : "#111", color: p.stockStatus === st ? (st === "active" ? "#22c55e" : st === "sold_out" ? "#e5202e" : "#eab308") : "#555" }}>
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                )}
                {/* Featured pin toggle */}
                {canEdit && (
                  <button onClick={() => quickFeatured(p._id, !p.featured)}
                    style={{ width: "100%", background: p.featured ? "rgba(234,179,8,.15)" : "#0a0a0a", border: `1px solid ${p.featured ? "#eab308" : "#1e1e1e"}`, color: p.featured ? "#eab308" : "#444", padding: ".35rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".68rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", marginBottom: ".5rem" }}>
                    {p.featured ? "📌 PINNED TO HOMEPAGE" : "📌 PIN TO HOMEPAGE"}
                  </button>
                )}
                {/* Actions */}
                {(canEdit || canDelete) && (
                  <div style={{ display: "flex", gap: ".5rem" }}>
                    {canEdit && (
                      <button onClick={() => openEdit(p)}
                        style={{ flex: 1, background: "rgba(59,130,246,.15)", color: "#3b82f6", border: "none", padding: ".4rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                        EDIT
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => deleteProduct(p._id, p.name)}
                        style={{ flex: 1, background: "rgba(229,32,46,.12)", color: "#e5202e", border: "none", padding: ".4rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                        DELETE
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {modal && (
        <>
          <div onClick={() => setModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 2000 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#0d0d0d", border: "1px solid #1e1e1e", width: 620, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", zIndex: 2001 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem", borderBottom: "1px solid #1e1e1e" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2 }}>{editing ? "EDIT PRODUCT" : "ADD PRODUCT"}</span>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "#f5f5f5", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Main Image upload */}
              <div>
                <label style={LBL}>Main Product Image</label>
                <div onClick={() => !uploadingImg && fileRef.current?.click()}
                  style={{ border: "2px dashed #1e1e1e", height: 140, display: "flex", alignItems: "center", justifyContent: "center", cursor: uploadingImg ? "wait" : "pointer", position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
                  {uploadingImg ? (
                    <div style={{ textAlign: "center", color: "#555" }}>
                      <div style={{ fontSize: ".85rem", fontWeight: 700, letterSpacing: 1 }}>UPLOADING…</div>
                    </div>
                  ) : form.image ? (
                    <Image src={form.image} alt="preview" fill style={{ objectFit: "cover" }} unoptimized />
                  ) : (
                    <div style={{ textAlign: "center", color: "#444" }}>
                      <div style={{ fontSize: "2rem", marginBottom: ".4rem" }}>📷</div>
                      <div style={{ fontSize: ".78rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Click to upload main image</div>
                      <div style={{ fontSize: ".7rem", color: "#333", marginTop: ".2rem" }}>JPG, PNG, WEBP — max 5MB</div>
                    </div>
                  )}
                </div>
                {form.image && (
                  <button type="button" onClick={() => setF("image", "")}
                    style={{ marginTop: ".3rem", background: "none", border: "none", color: "#e5202e", fontSize: ".72rem", fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>
                    ✕ Remove main image
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = "" }} />
                <input style={{ ...INP, marginTop: ".5rem", fontSize: ".8rem" }} placeholder="Or paste image URL / path…" value={form.image} onChange={e => setF("image", e.target.value)} />
              </div>

              {/* Additional Images */}
              <div>
                <label style={LBL}>Additional Images (Gallery)</label>
                {(form.images || []).length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: ".75rem" }}>
                    {(form.images || []).map((img, idx) => (
                      <div key={idx} style={{ position: "relative", width: 80, height: 80, background: "#111", flexShrink: 0 }}>
                        <Image src={img} alt={`img ${idx+1}`} fill style={{ objectFit: "cover" }} unoptimized />
                        <button type="button" onClick={() => removeAdditionalImage(idx)}
                          style={{ position: "absolute", top: 2, right: 2, background: "rgba(229,32,46,.9)", border: "none", color: "#fff", width: 18, height: 18, fontSize: ".65rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => !uploadingImg && multiImgRef.current?.click()} disabled={uploadingImg}
                  style={{ background: "transparent", border: "1px dashed #333", color: "#555", padding: ".55rem 1.2rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: uploadingImg ? "not-allowed" : "pointer" }}>
                  {uploadingImg ? "UPLOADING…" : "+ ADD MORE IMAGES"}
                </button>
                <input ref={multiImgRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => { if (e.target.files?.length) handleAdditionalImages(e.target.files); e.target.value = "" }} />
                <div style={{ marginTop: ".5rem" }}>
                  <input style={{ ...INP, fontSize: ".8rem" }} placeholder="Or paste extra image URL and press Enter…"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const val = (e.currentTarget.value || "").trim()
                        if (val) { setForm(f => ({ ...f, images: [...(f.images || []), val] })); e.currentTarget.value = "" }
                      }
                    }} />
                  <div style={{ fontSize: ".68rem", color: "#444", marginTop: ".3rem" }}>Press Enter to add each URL</div>
                </div>
              </div>

              {/* Name & Price */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <div><label style={LBL}>Product Name *</label><input style={INP} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Air Flux X — Pro" /></div>
                <div><label style={LBL}>Price ({symbol}) *</label><input style={INP} type="number" value={form.price || ""} onChange={e => setF("price", parseFloat(e.target.value)||0)} placeholder="199" /></div>
              </div>

              {/* Description */}
              <div>
                <label style={LBL}>Description</label>
                <textarea style={{ ...INP, height: 80, resize: "vertical" }} value={form.description} onChange={e => setF("description", e.target.value)} placeholder="Engineered for performance…" />
              </div>

              {/* Category & Tag */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={LBL}>Category</label>
                  <select style={{ ...INP, appearance: "none" }} value={form.category} onChange={e => setF("category", e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} style={{ background: "#0d0d0d" }}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Tag</label>
                  <select style={{ ...INP, appearance: "none" }} value={form.tag} onChange={e => setF("tag", e.target.value)}>
                    {TAGS.map(t => <option key={t} value={t} style={{ background: "#0d0d0d" }}>{t || "— None —"}</option>)}
                  </select>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label style={LBL}>Available Sizes</label>
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: ".5rem" }}>
                  {activeSizes.map(s => (
                    <button key={s} onClick={() => toggleSize(s)} type="button"
                      style={{ border: `1px solid ${form.sizes.includes(s) ? "#e5202e" : "#1e1e1e"}`, color: form.sizes.includes(s) ? "#e5202e" : "#555", padding: ".35rem .7rem", fontSize: ".72rem", fontWeight: 700, cursor: "pointer", background: form.sizes.includes(s) ? "rgba(229,32,46,.08)" : "transparent", fontFamily: "'Barlow', sans-serif", transition: "all .15s" }}>
                      {s}
                    </button>
                  ))}
                </div>
                <input style={{ ...INP, fontSize: ".8rem" }} placeholder="Or type custom sizes, comma-separated: S, M, L, XL" value={form.sizes.join(", ")} onChange={e => setF("sizes", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
              </div>

              {/* Stock Status */}
              <div>
                <label style={LBL}>Stock Status</label>
                <div style={{ display: "flex", gap: ".75rem" }}>
                  {([["active","✓ Active","#22c55e"],["sold_out","✗ Sold Out","#e5202e"],["coming_soon","◉ Coming Soon","#eab308"]] as [StockStatus,string,string][]).map(([val,lbl,col]) => (
                    <label key={val} style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".6rem 1rem", border: `1px solid ${form.stockStatus === val ? col : "#1e1e1e"}`, cursor: "pointer", flex: 1, background: form.stockStatus === val ? `${col}15` : "transparent" }}>
                      <input type="radio" name="stockStatus" value={val} checked={form.stockStatus === val} onChange={() => setF("stockStatus", val)} style={{ accentColor: col }} />
                      <span style={{ fontSize: ".75rem", fontWeight: 700, color: form.stockStatus === val ? col : "#555" }}>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", padding: "1.5rem", borderTop: "1px solid #1e1e1e" }}>
              <button onClick={() => setModal(false)} style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#888", padding: ".65rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".78rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>CANCEL</button>
              <button onClick={save} disabled={saving} style={{ background: saving ? "#333" : "#e5202e", color: "#fff", border: "none", padding: ".65rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "SAVING…" : editing ? "UPDATE PRODUCT" : "ADD PRODUCT"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", right: "2rem", background: "#111", borderLeft: `3px solid ${toast.ok ? "#22c55e" : "#e5202e"}`, border: "1px solid #1e1e1e", padding: "1rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontSize: ".85rem", fontWeight: 700, zIndex: 3000, color: "#f5f5f5" }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
