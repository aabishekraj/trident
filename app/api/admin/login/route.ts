import { NextRequest, NextResponse } from "next/server"

const ADMIN_USER = process.env.ADMIN_USERNAME ?? "admin"
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? "trident2026"

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const res = NextResponse.json({ success: true })
    res.cookies.set("trident_admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
    return res
  }
  return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete("trident_admin_session")
  return res
}