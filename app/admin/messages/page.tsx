"use client"

import { useEffect, useState } from "react"

type MessageType   = "support" | "cancel_request" | "return_request" | "replacement_request"
type MessageStatus = "new" | "read" | "in_progress" | "resolved" | "closed"
type Message = {
  _id: string; ticketId: string; type: MessageType; status: MessageStatus
  subject: string; message: string; customerName: string; customerEmail: string
  orderId?: string; adminReply?: string; repliedAt?: string; createdAt: string
}

const TYPE_LABEL: Record<MessageType, string> = {
  support:              "💬 Support",
  cancel_request:       "✕  Cancel",
  return_request:       "↩  Return",
  replacement_request:  "🔄 Replace",
}
const TYPE_COLOR: Record<MessageType, string> = {
  support:             "#3b82f6",
  cancel_request:      "#e5202e",
  return_request:      "#eab308",
  replacement_request: "#8b5cf6",
}
const STATUS_COLOR: Record<MessageStatus, string> = {
  new:         "#e5202e",
  read:        "#eab308",
  in_progress: "#3b82f6",
  resolved:    "#22c55e",
  closed:      "#555",
}
const INP: React.CSSProperties = { width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".65rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".88rem", outline: "none" }

export default function AdminMessagesPage() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [loading,  setLoading]    = useState(true)
  const [open,     setOpen]       = useState<string | null>(null)
  const [reply,    setReply]      = useState("")
  const [sending,  setSending]    = useState(false)
  const [toast,    setToast]      = useState<{msg:string;ok:boolean}|null>(null)
  const [filterStatus, setFilterStatus] = useState("")
  const [filterType,   setFilterType]   = useState("")
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set("status", filterStatus)
      if (filterType)   params.set("type", filterType)
      const r = await fetch(`/api/messages?${params}`)
      const j = await r.json()
      setMessages(j.success ? j.data : [])
    } catch { setMessages([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [filterStatus, filterType])  // eslint-disable-line react-hooks/exhaustive-deps

  async function markRead(id: string) {
    await fetch(`/api/messages/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "read" }) })
    setMessages(prev => prev.map(m => m._id === id ? { ...m, status: "read" } : m))
  }

  async function updateStatus(id: string, status: MessageStatus) {
    try {
      const r = await fetch(`/api/messages/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
      const j = await r.json()
      if (j.success) { setMessages(prev => prev.map(m => m._id === id ? { ...m, status } : m)); showToast("Status updated.") }
    } catch { showToast("Failed.", false) }
  }

  async function sendReply(id: string) {
    if (!reply.trim()) return
    setSending(true)
    try {
      const r = await fetch(`/api/messages/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminReply: reply, status: "in_progress" }) })
      const j = await r.json()
      if (j.success) {
        setMessages(prev => prev.map(m => m._id === id ? { ...m, adminReply: reply, status: "in_progress" } : m))
        setReply(""); showToast("Reply saved.")
      } else showToast(j.error || "Failed.", false)
    } catch { showToast("Failed.", false) }
    setSending(false)
  }

  async function deleteMsg(id: string) {
    if (!confirm("Delete this message?")) return
    await fetch(`/api/messages/${id}`, { method: "DELETE" })
    setMessages(prev => prev.filter(m => m._id !== id))
    if (open === id) setOpen(null)
    showToast("Deleted.")
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function bulkDelete(all: boolean) {
    const count = all ? messages.length : selected.size
    if (!count) return
    if (!confirm(all ? `Delete ALL ${count} messages? This cannot be undone.` : `Delete ${count} selected message${count > 1 ? "s" : ""}?`)) return
    setBulkDeleting(true)
    try {
      const body = all ? { all: true } : { ids: Array.from(selected) }
      const r = await fetch("/api/messages", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const j = await r.json()
      if (j.success) {
        showToast(`Deleted ${j.deleted} message${j.deleted !== 1 ? "s" : ""}.`)
        setSelected(new Set())
        setOpen(null)
        load()
      } else showToast(j.error || "Failed.", false)
    } catch { showToast("Error.", false) }
    setBulkDeleting(false)
  }

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const stats = {
    total:  messages.length,
    new:    messages.filter(m => m.status === "new").length,
    open:   messages.filter(m => ["new","read","in_progress"].includes(m.status)).length,
    cancel: messages.filter(m => m.type === "cancel_request").length,
  }

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", right: "2rem", background: toast.ok ? "#22c55e" : "#e5202e", color: "#fff", padding: ".85rem 1.5rem", fontWeight: 700, fontSize: ".82rem", letterSpacing: 1, zIndex: 9999 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2 }}>
          MES<span style={{ color: "#e5202e" }}>SAGES</span>
        </h1>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
          {selected.size > 0 && (
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
          {messages.length > 0 && (
            <button onClick={() => bulkDelete(true)} disabled={bulkDeleting}
              style={{ background: "transparent", border: "1px solid #333", color: "#555", padding: ".4rem .85rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".7rem", letterSpacing: 1, textTransform: "uppercase", cursor: bulkDeleting ? "not-allowed" : "pointer" }}>
              DELETE ALL
            </button>
          )}
          <button onClick={() => { setSelected(new Set(messages.map(m => m._id))); }}
            style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#555", padding: ".4rem .85rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".7rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
            {selected.size === messages.length && messages.length > 0 ? "✓ ALL" : "SELECT ALL"}
          </button>
          <button onClick={load} style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#666", padding: ".4rem .85rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>↻ REFRESH</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "1px", background: "#1e1e1e", marginBottom: "2rem" }}>
        {[["Total", stats.total, "#f5f5f5"], ["Unread", stats.new, "#e5202e"], ["Open", stats.open, "#eab308"], ["Cancel Requests", stats.cancel, "#8b5cf6"]].map(([l, v, c]) => (
          <div key={String(l)} style={{ flex: 1, background: "#0d0d0d", padding: "1.2rem 1.5rem" }}>
            <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".3rem" }}>{l}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: String(c) }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ ...INP, width: 160, padding: ".55rem 1rem", appearance: "none" }}>
          <option value="">All Statuses</option>
          {(["new","read","in_progress","resolved","closed"] as MessageStatus[]).map(s => (
            <option key={s} value={s}>{s.replace("_"," ")}</option>
          ))}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ ...INP, width: 200, padding: ".55rem 1rem", appearance: "none" }}>
          <option value="">All Types</option>
          {(["support","cancel_request","return_request","replacement_request"] as MessageType[]).map(t => (
            <option key={t} value={t}>{TYPE_LABEL[t]}</option>
          ))}
        </select>
        <div style={{ color: "#555", fontSize: ".82rem", alignSelf: "center" }}>{messages.length} messages</div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#555" }}>Loading…</div>
      ) : messages.length === 0 ? (
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "4rem", textAlign: "center", color: "#555" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💬</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: 2 }}>NO MESSAGES YET</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#1e1e1e" }}>
          {messages.map(msg => (
            <div key={msg._id}>
              {/* Row */}
              <div style={{ background: msg.status === "new" ? "#0f0f0f" : "#0d0d0d", padding: "1.1rem 1.5rem", cursor: "pointer", display: "grid", gridTemplateColumns: "20px auto 1fr auto", gap: "1rem", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                onMouseLeave={e => (e.currentTarget.style.background = msg.status === "new" ? "#0f0f0f" : "#0d0d0d")}>

                {/* Checkbox */}
                <div onClick={e => { e.stopPropagation(); toggleSelect(msg._id) }}
                  style={{ width: 18, height: 18, background: selected.has(msg._id) ? "#e5202e" : "rgba(0,0,0,.7)", border: `2px solid ${selected.has(msg._id) ? "#e5202e" : "#333"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", color: "#fff", fontWeight: 900, flexShrink: 0, cursor: "pointer" }}>
                  {selected.has(msg._id) ? "✓" : ""}
                </div>

                {/* Type badge */}
                <span onClick={() => { setOpen(open === msg._id ? null : msg._id); if (msg.status === "new") markRead(msg._id) }}
                  style={{ display: "inline-block", padding: ".25rem .65rem", fontSize: ".6rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", background: `${TYPE_COLOR[msg.type]}18`, color: TYPE_COLOR[msg.type], whiteSpace: "nowrap" }}>
                  {TYPE_LABEL[msg.type]}
                </span>

                <div onClick={() => { setOpen(open === msg._id ? null : msg._id); if (msg.status === "new") markRead(msg._id) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap", marginBottom: ".25rem" }}>
                    <span style={{ fontWeight: 700, fontSize: ".88rem" }}>{msg.subject}</span>
                    {msg.status === "new" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e5202e", flexShrink: 0 }} />}
                  </div>
                  <div style={{ color: "#555", fontSize: ".72rem" }}>
                    {msg.customerName} · {msg.customerEmail}
                    {msg.orderId && ` · Order: ${msg.orderId}`}
                    {" · "}{new Date(msg.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>

                <div onClick={() => { setOpen(open === msg._id ? null : msg._id); if (msg.status === "new") markRead(msg._id) }}
                  style={{ display: "flex", alignItems: "center", gap: ".75rem", flexShrink: 0 }}>
                  <span style={{ display: "inline-block", padding: ".2rem .6rem", fontSize: ".6rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", background: `${STATUS_COLOR[msg.status]}18`, color: STATUS_COLOR[msg.status] }}>
                    {msg.status.replace("_"," ")}
                  </span>
                  <span style={{ color: "#333", fontSize: ".7rem" }}>{open === msg._id ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded */}
              {open === msg._id && (
                <div style={{ background: "#080808", borderTop: "1px solid #1a1a1a", padding: "1.5rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

                    {/* Left: message */}
                    <div>
                      <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".5rem" }}>Customer Message</div>
                      <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1rem", color: "#888", fontSize: ".85rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                        {msg.message}
                      </div>

                      {/* Status update */}
                      <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".5rem" }}>Update Status</div>
                      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                        {(["new","read","in_progress","resolved","closed"] as MessageStatus[]).map(s => (
                          <button key={s} onClick={() => updateStatus(msg._id, s)}
                            style={{ padding: ".3rem .75rem", border: `1px solid ${msg.status === s ? STATUS_COLOR[s] : "#1e1e1e"}`, background: msg.status === s ? `${STATUS_COLOR[s]}18` : "transparent", color: msg.status === s ? STATUS_COLOR[s] : "#555", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".65rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                            {s.replace("_"," ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right: reply */}
                    <div>
                      {msg.adminReply && (
                        <div style={{ marginBottom: "1.5rem" }}>
                          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#22c55e", marginBottom: ".5rem" }}>Previous Reply</div>
                          <div style={{ background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.2)", padding: "1rem", color: "#888", fontSize: ".85rem", lineHeight: 1.7 }}>
                            {msg.adminReply}
                          </div>
                        </div>
                      )}

                      <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".5rem" }}>Reply to Customer</div>
                      <textarea value={reply} onChange={e => setReply(e.target.value)}
                        placeholder="Write your reply here…"
                        style={{ ...INP, height: 120, resize: "vertical", marginBottom: ".75rem" }} />
                      <div style={{ display: "flex", gap: ".5rem" }}>
                        <button onClick={() => sendReply(msg._id)} disabled={sending || !reply.trim()}
                          style={{ flex: 1, background: !reply.trim() ? "#111" : "#e5202e", color: !reply.trim() ? "#333" : "#fff", border: "none", padding: ".65rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".75rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: !reply.trim() ? "not-allowed" : "pointer" }}>
                          {sending ? "SAVING…" : "SAVE REPLY"}
                        </button>
                        <button onClick={() => deleteMsg(msg._id)}
                          style={{ background: "rgba(229,32,46,.1)", border: "1px solid rgba(229,32,46,.3)", color: "#e5202e", padding: ".65rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".75rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
