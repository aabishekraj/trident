import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import AdminUser, { hashPassword } from "@/models/AdminUser"

const ADMIN_USER = process.env.ADMIN_USERNAME ?? "admin"
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? "trident2026"

function setCookie(res: NextResponse, value: string) {
  res.cookies.set("trident_admin_session", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) {
    return NextResponse.json({ success: false, error: "username and password required" }, { status: 400 })
  }

  // 1. Env-var superadmin check first (instant, no DB needed)
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const sessionPayload = JSON.stringify({ username, role: "superadmin" })
    const sessionToken   = Buffer.from(sessionPayload).toString("base64")
    const res = NextResponse.json({ success: true, role: "superadmin", username })
    setCookie(res, sessionToken)
    return res
  }

  // 2. Try DB admin users with a 4-second timeout to avoid hanging
  try {
    const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("db_timeout")), 4000))
    await Promise.race([connectDB(), timeout])
    const dbUser = await AdminUser.findOne({ username, active: true })
    if (dbUser && dbUser.checkPassword(password)) {
      await AdminUser.findByIdAndUpdate(dbUser._id, { lastLogin: new Date() })
      const sessionPayload = JSON.stringify({ id: dbUser._id, username: dbUser.username, role: dbUser.role })
      const sessionToken   = Buffer.from(sessionPayload).toString("base64")
      const res = NextResponse.json({ success: true, role: dbUser.role, username: dbUser.username })
      setCookie(res, sessionToken)
      return res
    }
  } catch { /* DB unavailable or timeout — fall through */ }

  return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete("trident_admin_session")
  return res
}

// GET /api/admin/login — returns current session info
export async function GET(req: NextRequest) {
  const session = req.cookies.get("trident_admin_session")?.value
  if (!session) return NextResponse.json({ loggedIn: false })
  try {
    const data = JSON.parse(Buffer.from(session, "base64").toString("utf8"))
    return NextResponse.json({ loggedIn: true, ...data })
  } catch {
    return NextResponse.json({ loggedIn: false })
  }
}

// POST /api/admin/seed — auto-seed superadmin user on first run
export async function PUT(req: NextRequest) {
  try {
    await connectDB()
    // Check if any admin users exist
    const count = await AdminUser.countDocuments()
    if (count > 0) return NextResponse.json({ message: "Users already exist" })

    const body = await req.json().catch(() => ({}))
    const username = body.username || ADMIN_USER
    const password = body.password || ADMIN_PASS
    const email    = body.email    || "admin@trident.store"

    await AdminUser.create({
      username,
      email,
      password: hashPassword(password),
      role:     "superadmin",
      createdBy: "system",
    })
    return NextResponse.json({ success: true, message: "Superadmin created" })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
