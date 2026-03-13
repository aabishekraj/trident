import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import AdminUser, { hashPassword } from "@/models/AdminUser"
import { signSession } from "@/lib/sessionSigner"

// Require env vars — fail loudly if missing so misconfiguration is caught early
const ADMIN_USER = process.env.ADMIN_USERNAME
const ADMIN_PASS = process.env.ADMIN_PASSWORD

function setCookie(res: NextResponse, value: string) {
  const isHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://")
  res.cookies.set("trident_admin_session", value, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  })
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) {
    return NextResponse.json({ success: false, error: "username and password required" }, { status: 400 })
  }

  // 1. Env-var superadmin check first (only if env vars are configured)
  if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
    const sessionToken = signSession({ username, role: "superadmin" })
    const res = NextResponse.json({ success: true, role: "superadmin", username })
    setCookie(res, sessionToken)
    return res
  }

  // 2. Try DB admin users — fail securely if DB unavailable
  try {
    const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("db_timeout")), 4000))
    await Promise.race([connectDB(), timeout])
    const dbUser = await AdminUser.findOne({ username, active: true })
    if (dbUser && await dbUser.checkPassword(password)) {
      await AdminUser.findByIdAndUpdate(dbUser._id, { lastLogin: new Date() })
      const sessionToken = signSession({ id: String(dbUser._id), username: dbUser.username, role: dbUser.role })
      const res = NextResponse.json({ success: true, role: dbUser.role, username: dbUser.username })
      setCookie(res, sessionToken)
      return res
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "db_timeout"
    // Fail securely — never authenticate when DB is unavailable
    console.error("[admin/login] DB error:", isTimeout ? "timeout" : err)
  }

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
  const { verifySession } = await import("@/lib/sessionSigner")
  const data = verifySession(session)
  if (!data) return NextResponse.json({ loggedIn: false })
  return NextResponse.json({ loggedIn: true, ...data })
}

// PUT /api/admin/seed — auto-seed superadmin user on first run
export async function PUT(req: NextRequest) {
  try {
    await connectDB()
    const count = await AdminUser.countDocuments()
    if (count > 0) return NextResponse.json({ message: "Users already exist" })

    const body = await req.json().catch(() => ({}))
    const username = body.username || ADMIN_USER || "admin"
    const password = body.password || ADMIN_PASS
    const email    = body.email    || "admin@trident.store"

    if (!password) {
      return NextResponse.json({ success: false, error: "ADMIN_PASSWORD env var not set" }, { status: 400 })
    }

    await AdminUser.create({
      username,
      email,
      password: await hashPassword(password),
      role:     "superadmin",
      createdBy: "system",
    })
    return NextResponse.json({ success: true, message: "Superadmin created" })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
