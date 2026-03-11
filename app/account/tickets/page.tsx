"use client"

import { useEffect, useState } from "react"

type TicketComment = {
  _id:        string
  from:       "customer" | "admin"
  authorName: string
  text:       string
  createdAt:  string
}

type Ticket = {
  _id:           string
  ticketId:      string
  type:          string
  status:        string
  subject:       string
  message:       string
  customerName:  string
  customerEmail: string
  orderId?:      string
  adminReply?:   string
  repliedAt?:    string
  comments:      TicketComment[]
  createdAt:     string
}

const STATUS_COLORS: Record<string, string> = {
  new:         "#3b82f6",
  read:        "#8b5cf6",
  in_progress: "#f59e0b",
  resolved:    "#22c55e",
  closed:      "#6b7280",
}

const TYPE_LABELS: Record<string, string> = {
  support:             "Support",
  cancel_request:      "Cancellation",
  return_request:      "Return",
  replacement_request: "Replacement",
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function TicketsPage() {
  const [tickets,     setTickets]     = useState<Ticket[]>([])
  const [selected,    setSelected]    = useState<Ticket | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [replyText,   setReplyText]   = useState("")
  const [sending,     setSending]     = useState(false)
  const [error,       setError]       = useState("")
  const [email,       setEmail]       = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("trident_customer")
    if (!saved) return
    const { email: em } = JSON.parse(saved)
    setEmail(em)
    fetch("/api/messages", { headers: { "x-customer-email": em } })
      .then(r => r.json())
      .then(d => { if (d.success) setTickets(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function openTicket(t: Ticket) {
    // Fetch full ticket by ticketId to get latest comments
    try {
      const res = await fetch(`/api/messages/${t.ticketId}`, {
        headers: { "x-customer-email": email }
      })
      const d = await res.json()
      if (d.success) setSelected(d.data)
      else setSelected(t)
    } catch {
      setSelected(t)
    }
    setReplyText("")
    setError("")
  }

  async function sendReply() {
    if (!selected || !replyText.trim() || !email) return
    setSending(true)
    setError("")
    try {
      const res = await fetch(`/api/messages/${selected.ticketId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", "x-customer-email": email },
        body:    JSON.stringify({ comment: replyText.trim() }),
      })
      const d = await res.json()
      if (d.success) {
        setSelected(d.data)
        setReplyText("")
        // Update in list
        setTickets(prev => prev.map(t => t.ticketId === d.data.ticketId ? d.data : t))
      } else {
        setError(d.error || "Failed to send reply.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <div style={{ color: "#555", padding: "3rem", textAlign: "center", fontFamily: "'Barlow', sans-serif" }}>Loading tickets…</div>
  )

  // ── Ticket detail view ────────────────────────────────────────────────────
  if (selected) {
    return (
      <div>
        {/* Back */}
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontFamily: "'Barlow', sans-serif", fontSize: ".82rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: ".5rem", padding: 0 }}>
          ← Back to Tickets
        </button>

        {/* Header */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2, marginBottom: ".4rem" }}>{selected.subject}</div>
              <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#555" }}>#{selected.ticketId}</span>
                <span style={{ background: "#111", border: `1px solid ${STATUS_COLORS[selected.status] || "#444"}`, color: STATUS_COLORS[selected.status] || "#888", fontSize: ".65rem", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", padding: ".25rem .6rem" }}>
                  {selected.status.replace("_", " ")}
                </span>
                <span style={{ background: "#111", border: "1px solid #222", color: "#666", fontSize: ".65rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: ".25rem .6rem" }}>
                  {TYPE_LABELS[selected.type] || selected.type}
                </span>
              </div>
            </div>
            <div style={{ color: "#444", fontSize: ".75rem", textAlign: "right", flexShrink: 0 }}>
              Opened {formatDate(selected.createdAt)}
            </div>
          </div>
          {selected.orderId && (
            <div style={{ marginTop: ".75rem", color: "#555", fontSize: ".78rem" }}>Order ID: <span style={{ color: "#888" }}>{selected.orderId}</span></div>
          )}
        </div>

        {/* Thread */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          {(selected.comments || []).map((c, i) => {
            const isAdmin = c.from === "admin"
            return (
              <div key={c._id || i} style={{
                display: "flex", flexDirection: "column",
                alignItems: isAdmin ? "flex-start" : "flex-end",
              }}>
                <div style={{
                  maxWidth: "80%", background: isAdmin ? "#111" : "#0d0d0d",
                  border: `1px solid ${isAdmin ? "#e5202e22" : "#1e1e1e"}`,
                  borderLeft: isAdmin ? "3px solid #e5202e" : "1px solid #1e1e1e",
                  padding: "1rem 1.25rem",
                }}>
                  <div style={{ display: "flex", gap: ".75rem", alignItems: "center", marginBottom: ".6rem" }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: isAdmin ? "#e5202e" : "#1e1e1e",
                      border: isAdmin ? "none" : "1px solid #333",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: ".7rem", fontWeight: 800, flexShrink: 0,
                      color: isAdmin ? "#fff" : "#888",
                    }}>
                      {isAdmin ? "A" : c.authorName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".82rem", color: isAdmin ? "#e5202e" : "#f5f5f5" }}>
                        {isAdmin ? `${c.authorName} · Support Team` : c.authorName}
                      </div>
                      <div style={{ color: "#444", fontSize: ".7rem" }}>{formatDate(c.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{ color: "#c8c8c8", fontSize: ".85rem", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{c.text}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reply box — only if not closed */}
        {selected.status !== "closed" && (
          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem" }}>
            <div style={{ fontWeight: 800, fontSize: ".82rem", letterSpacing: 1, textTransform: "uppercase", marginBottom: "1rem" }}>Add Follow-Up</div>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write your message here…"
              rows={4}
              style={{
                width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e",
                color: "#f5f5f5", fontFamily: "'Barlow', sans-serif", fontSize: ".88rem",
                padding: ".85rem 1rem", resize: "vertical", outline: "none",
                boxSizing: "border-box",
              }}
            />
            {error && <div style={{ color: "#e5202e", fontSize: ".78rem", marginTop: ".5rem", fontWeight: 600 }}>{error}</div>}
            <button
              onClick={sendReply}
              disabled={sending || !replyText.trim()}
              style={{
                marginTop: "1rem",
                background: (sending || !replyText.trim()) ? "#1e1e1e" : "#e5202e",
                color:      (sending || !replyText.trim()) ? "#444"    : "#fff",
                border: "none", padding: ".75rem 2rem",
                fontFamily: "'Barlow', sans-serif", fontWeight: 800,
                fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase",
                cursor: (sending || !replyText.trim()) ? "not-allowed" : "pointer",
                transition: "all .2s",
              }}
            >
              {sending ? "SENDING…" : "SEND REPLY"}
            </button>
          </div>
        )}

        {selected.status === "closed" && (
          <div style={{ textAlign: "center", padding: "1.5rem", border: "1px solid #1e1e1e", color: "#444", fontSize: ".82rem" }}>
            This ticket is closed. <a href="/support" style={{ color: "#e5202e", textDecoration: "none" }}>Open a new ticket</a> if you need further help.
          </div>
        )}
      </div>
    )
  }

  // ── Ticket list view ──────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", letterSpacing: 3, marginBottom: ".3rem" }}>MY TICKETS</h1>
          <p style={{ color: "#555", fontSize: ".82rem" }}>Track your support requests and conversations.</p>
        </div>
        <a href="/support" style={{
          background: "#e5202e", color: "#fff", padding: ".65rem 1.5rem",
          fontFamily: "'Barlow', sans-serif", fontWeight: 800,
          fontSize: ".72rem", letterSpacing: 2, textTransform: "uppercase",
          textDecoration: "none", transition: "background .2s",
        }}>
          + NEW TICKET
        </a>
      </div>

      {tickets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem", border: "1px solid #1e1e1e", color: "#444" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎫</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: 2, marginBottom: ".5rem", color: "#555" }}>NO TICKETS YET</div>
          <p style={{ fontSize: ".82rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>Need help? Our support team is here for you.</p>
          <a href="/support" style={{ display: "inline-block", background: "#e5202e", color: "#fff", padding: ".75rem 2.5rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
            CONTACT SUPPORT →
          </a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#1e1e1e", border: "1px solid #1e1e1e" }}>
          {tickets.map(t => {
            const lastComment = t.comments?.[t.comments.length - 1]
            const hasAdminReply = t.comments?.some(c => c.from === "admin")
            return (
              <button key={t._id} onClick={() => openTicket(t)} style={{
                background: "#0a0a0a", border: "none", cursor: "pointer",
                padding: "1.25rem 1.5rem", textAlign: "left", width: "100%",
                transition: "background .15s", fontFamily: "'Barlow', sans-serif",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
                onMouseLeave={e => (e.currentTarget.style.background = "#0a0a0a")}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: ".4rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: ".9rem", color: "#f5f5f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.subject}
                      </span>
                      {hasAdminReply && (
                        <span style={{ background: "rgba(229,32,46,.1)", color: "#e5202e", fontSize: ".62rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: ".2rem .5rem", border: "1px solid rgba(229,32,46,.2)", whiteSpace: "nowrap" }}>
                          Admin Replied
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: ".6rem", alignItems: "center", marginBottom: ".5rem", flexWrap: "wrap" }}>
                      <span style={{ color: "#555", fontSize: ".72rem", fontWeight: 700, letterSpacing: 1 }}>#{t.ticketId}</span>
                      <span style={{ color: "#333" }}>·</span>
                      <span style={{ color: "#555", fontSize: ".72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{TYPE_LABELS[t.type] || t.type}</span>
                    </div>

                    {lastComment && (
                      <div style={{ color: "#555", fontSize: ".78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 }}>
                        <span style={{ color: lastComment.from === "admin" ? "#e5202e88" : "#666" }}>
                          {lastComment.from === "admin" ? "Support: " : "You: "}
                        </span>
                        {lastComment.text}
                      </div>
                    )}
                  </div>

                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".5rem" }}>
                    <span style={{ background: "#111", border: `1px solid ${STATUS_COLORS[t.status] || "#444"}`, color: STATUS_COLORS[t.status] || "#888", fontSize: ".62rem", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", padding: ".2rem .55rem" }}>
                      {t.status.replace("_", " ")}
                    </span>
                    <span style={{ color: "#444", fontSize: ".72rem" }}>{formatDate(t.createdAt)}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
