import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE = "trident_admin_session"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only guard /admin routes — leave the login page open
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next()
  }

  // Validate the session cookie (base64-encoded JSON with a username field)
  const session = req.cookies.get(SESSION_COOKIE)?.value
  if (session) {
    try {
      const data = JSON.parse(Buffer.from(session, "base64").toString("utf8"))
      if (data?.username) return NextResponse.next()
    } catch {
      // Corrupted cookie — fall through to redirect
    }
  }

  // No valid session → redirect to login, preserving the intended destination
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = "/admin/login"
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin/:path*"],
}
