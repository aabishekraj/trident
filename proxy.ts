import { NextRequest, NextResponse } from "next/server";

// Add your actual admin credentials to .env.local:
//   ADMIN_USERNAME=admin
//   ADMIN_PASSWORD=your_secure_password
//   ADMIN_SECRET=a_random_long_string_for_cookie_signing

const ADMIN_USER = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? "trident2026";
const SESSION_COOKIE = "trident_admin_session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes (but not the login page itself)
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  // Check for valid session cookie
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (session === "authenticated") {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};

// ─── Login API helper (add to /app/api/admin/login/route.ts) ──────────────────
// You can create that file separately using the credentials above.
// Example login handler:
//
// export async function POST(req: NextRequest) {
//   const { username, password } = await req.json();
//   if (username === ADMIN_USER && password === ADMIN_PASS) {
//     const res = NextResponse.json({ success: true });
//     res.cookies.set("trident_admin_session", "authenticated", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       maxAge: 60 * 60 * 24 * 7,  // 7 days
//     });
//     return res;
//   }
//   return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
// }
