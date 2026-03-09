// Server-only helper — reads the admin session cookie and checks permissions
import { NextRequest } from "next/server"
import { AdminRole, ROLE_PERMISSIONS } from "./roles"

export type AdminSession = { username: string; role: AdminRole; id?: string }

export function getAdminSession(req: NextRequest): AdminSession | null {
  const cookie = req.cookies.get("trident_admin_session")?.value
  if (!cookie) return null
  try {
    const data = JSON.parse(Buffer.from(cookie, "base64").toString("utf8"))
    if (!data?.username || !data?.role) return null
    return data as AdminSession
  } catch {
    return null
  }
}

type PermError = { error: string; status: number }

/**
 * Returns a PermError if the request is not allowed, otherwise null (allowed).
 * section: top-level key in ROLE_PERMISSIONS (e.g. "products")
 * action:  sub-key for object sections (e.g. "create", "edit", "delete")
 */
export function checkPermission(
  req: NextRequest,
  section: keyof typeof ROLE_PERMISSIONS[AdminRole],
  action?: string
): PermError | null {
  const session = getAdminSession(req)
  if (!session) return { error: "Unauthorized — admin login required", status: 401 }

  const perms = ROLE_PERMISSIONS[session.role]
  if (!perms) return { error: "Invalid role", status: 403 }

  const perm = perms[section]
  if (typeof perm === "boolean") {
    if (!perm) return { error: `Role '${session.role}' cannot access this resource`, status: 403 }
  } else if (typeof perm === "object" && perm !== null && action) {
    if (!(perm as Record<string, boolean>)[action]) {
      return { error: `Role '${session.role}' cannot perform '${action}' on '${String(section)}'`, status: 403 }
    }
  }
  return null
}
