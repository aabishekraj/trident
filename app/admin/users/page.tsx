"use client"

import { useEffect, useState } from "react"
import { ROLE_PERMISSIONS, AdminRole } from "@/models/AdminUser"

type AdminUser = {
  _id: string; username: string; email: string; role: AdminRole
  active: boolean; lastLogin: string | null; createdAt: string; createdBy: string
}

const ROLES: { value: AdminRole; label: string; desc: string; color: string }[] = [
  { value: "superadmin",     label: "Super Admin",    desc: "Full access — all features",                        color: "#e5202e" },
  { value: "manager",        label: "Manager",         desc: "Manage orders, products, coupons. View analytics", color: "#3b82f6" },
  { value: "order_manager",  label: "Order Manager",   desc: "View & edit orders only",                          color: "#8b5cf6" },
  { value: "analyst",        label: "Analyst",         desc: "Read-only: orders, products, analytics",           color: "#22c55e" },
]

const INP: React.CSSProperties = {
  width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e",
  color: "#f5f5f5", padding: ".7rem 1rem",
  fontFamily: "'Barlow', sans-serif", fontSize: ".88rem", outline: "none",
}
const LBL: React.CSSProperties = {
  display: "block", fontSize: ".68rem", fontWeight: 700,
  letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".4rem",
}

const EMPTY = { username: "", email: "", password: "", role: "analyst" as AdminRole }

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null)
  const [showPerm, setShowPerm] = useState<AdminRole | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/users")
      const j = await r.json()
      setUsers(j.data || [])
    } catch { setUsers([]) }
    setLoading(false)
  }

  async function createUser() {
    if (!form.username || !form.email || !form.password) return showToast("All fields required.", false)
    setSaving(true)
    try {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const j = await r.json()
      if (j.success) { showToast("User created!"); setModal(false); setForm(EMPTY); load() }
      else showToast(j.error || "Failed.", false)
    } catch { showToast("Error.", false) }
    setSaving(false)
  }

  async function toggleActive(user: AdminUser) {
    try {
      await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      })
      load()
    } catch { showToast("Failed.", false) }
  }

  async function changeRole(user: AdminUser, role: AdminRole) {
    try {
      await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      load()
      showToast("Role updated!")
    } catch { showToast("Failed.", false) }
  }

  async function deleteUser(user: AdminUser) {
    if (!confirm(`Delete user "${user.username}"?`)) return
    try {
      const r = await fetch(`/api/admin/users/${user._id}`, { method: "DELETE" })
      const j = await r.json()
      if (j.success) { showToast("Deleted."); load() }
    } catch { showToast("Failed.", false) }
  }

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }
  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const roleMap = Object.fromEntries(ROLES.map(r => [r.value, r]))

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2, margin: 0 }}>
            ADMIN <span style={{ color: "#e5202e" }}>USERS</span>
          </h1>
          <div style={{ color: "#444", fontSize: ".75rem", letterSpacing: 1.5, marginTop: ".25rem" }}>
            Manage who has access to the admin panel
          </div>
        </div>
        <button onClick={() => setModal(true)}
          style={{ background: "#e5202e", color: "#fff", border: "none", padding: ".55rem 1.3rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
          + ADD USER
        </button>
      </div>

      {/* Role legend */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1px", background: "#1e1e1e", marginBottom: "2rem" }}>
        {ROLES.map(r => (
          <div key={r.value} onClick={() => setShowPerm(showPerm === r.value ? null : r.value)}
            style={{ background: "#0d0d0d", padding: "1.25rem", cursor: "pointer", borderLeft: `3px solid ${r.color}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800, fontSize: ".88rem", color: r.color, letterSpacing: .5 }}>{r.label}</div>
              <span style={{ color: "#333", fontSize: ".8rem" }}>{showPerm === r.value ? "▲" : "▼"}</span>
            </div>
            <div style={{ color: "#555", fontSize: ".72rem", marginTop: ".3rem" }}>{r.desc}</div>
            {showPerm === r.value && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid #1a1a1a", paddingTop: ".75rem" }}>
                {Object.entries(ROLE_PERMISSIONS[r.value]).map(([section, perms]) => (
                  <div key={section} style={{ marginBottom: ".5rem" }}>
                    <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#444", marginBottom: ".25rem" }}>{section}</div>
                    {typeof perms === "boolean" ? (
                      <span style={{ fontSize: ".7rem", color: perms ? "#22c55e" : "#e5202e", fontWeight: 700 }}>{perms ? "✓ Access" : "✗ No access"}</span>
                    ) : (
                      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                        {Object.entries(perms as Record<string, boolean>).map(([perm, allowed]) => (
                          <span key={perm} style={{ fontSize: ".62rem", fontWeight: 700, padding: ".15rem .45rem", background: allowed ? "rgba(34,197,94,.1)" : "rgba(229,32,46,.1)", color: allowed ? "#22c55e" : "#e5202e", border: `1px solid ${allowed ? "#22c55e30" : "#e5202e30"}` }}>
                            {perm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Users list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#555" }}>Loading…</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: "2rem", marginBottom: ".75rem" }}>👤</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: 2, marginBottom: ".5rem" }}>NO ADMIN USERS</div>
          <p style={{ color: "#555", fontSize: ".85rem" }}>Create your first admin user to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#1e1e1e" }}>
          {users.map(user => (
            <div key={user._id} style={{ background: "#0d0d0d", padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: roleMap[user.role]?.color || "#333", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: "#fff", flexShrink: 0 }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: ".88rem" }}>{user.username}</div>
                    <div style={{ color: "#555", fontSize: ".72rem" }}>{user.email}</div>
                  </div>
                  <span style={{ display: "inline-block", padding: ".2rem .7rem", fontSize: ".62rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", background: `${roleMap[user.role]?.color || "#555"}18`, color: roleMap[user.role]?.color || "#888", border: `1px solid ${roleMap[user.role]?.color || "#555"}30` }}>
                    {roleMap[user.role]?.label || user.role}
                  </span>
                  {!user.active && (
                    <span style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: 1.5, color: "#e5202e", textTransform: "uppercase" }}>INACTIVE</span>
                  )}
                </div>
                <div style={{ color: "#333", fontSize: ".68rem", marginTop: ".35rem" }}>
                  Created by {user.createdBy}
                  {user.lastLogin && ` · Last login: ${new Date(user.lastLogin).toLocaleDateString()}`}
                  {!user.lastLogin && " · Never logged in"}
                </div>
              </div>

              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {/* Role selector */}
                <select value={user.role} onChange={e => changeRole(user, e.target.value as AdminRole)}
                  style={{ background: "#111", border: "1px solid #1e1e1e", color: "#888", padding: ".35rem .75rem", fontFamily: "'Barlow', sans-serif", fontSize: ".72rem", fontWeight: 700, outline: "none", appearance: "none", cursor: "pointer" }}>
                  {ROLES.map(r => <option key={r.value} value={r.value} style={{ background: "#0d0d0d" }}>{r.label}</option>)}
                </select>
                {/* Toggle active */}
                <button onClick={() => toggleActive(user)}
                  style={{ padding: ".35rem .75rem", fontSize: ".68rem", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", border: `1px solid ${user.active ? "#22c55e30" : "#333"}`, color: user.active ? "#22c55e" : "#555", background: user.active ? "rgba(34,197,94,.06)" : "transparent", cursor: "pointer" }}>
                  {user.active ? "ACTIVE" : "DISABLED"}
                </button>
                {/* Delete */}
                <button onClick={() => deleteUser(user)}
                  style={{ padding: ".35rem .75rem", fontSize: ".68rem", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", border: "1px solid rgba(229,32,46,.2)", color: "#e5202e", background: "rgba(229,32,46,.06)", cursor: "pointer" }}>
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create User Modal ── */}
      {modal && (
        <>
          <div onClick={() => setModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 2000 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#0d0d0d", border: "1px solid #1e1e1e", width: 480, maxWidth: "95vw", zIndex: 2001 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem", borderBottom: "1px solid #1e1e1e" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2 }}>NEW ADMIN USER</span>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "#f5f5f5", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div><label style={LBL}>Username *</label><input style={INP} value={form.username} onChange={e => setF("username", e.target.value)} placeholder="john_manager" /></div>
              <div><label style={LBL}>Email *</label><input style={INP} type="email" value={form.email} onChange={e => setF("email", e.target.value)} placeholder="john@trident.store" /></div>
              <div><label style={LBL}>Password *</label><input style={INP} type="password" value={form.password} onChange={e => setF("password", e.target.value)} placeholder="Minimum 8 characters" /></div>

              <div>
                <label style={LBL}>Role</label>
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                  {ROLES.map(r => (
                    <label key={r.value} style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: ".75rem 1rem", border: `1px solid ${form.role === r.value ? r.color : "#1e1e1e"}`, cursor: "pointer", background: form.role === r.value ? `${r.color}10` : "transparent", transition: "all .15s" }}>
                      <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => setF("role", r.value)} style={{ accentColor: r.color }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: ".82rem", color: form.role === r.value ? r.color : "#888" }}>{r.label}</div>
                        <div style={{ color: "#444", fontSize: ".7rem", marginTop: ".1rem" }}>{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", padding: "1.5rem", borderTop: "1px solid #1e1e1e" }}>
              <button onClick={() => setModal(false)} style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#888", padding: ".65rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".78rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>CANCEL</button>
              <button onClick={createUser} disabled={saving} style={{ background: saving ? "#333" : "#e5202e", color: "#fff", border: "none", padding: ".65rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "CREATING…" : "CREATE USER"}
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
