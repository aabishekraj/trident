import { NextRequest, NextResponse } from "next/server"
import { checkPermission } from "@/lib/adminAuth"
import fs from "fs"
import path from "path"
import crypto from "crypto"

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"])
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  // Must be an admin with product edit permission
  const denied = checkPermission(req, "products", "edit")
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })

  const data = await req.formData()
  const file = data.get("file") as File | null

  if (!file) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })

  // Enforce size limit
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: "File too large (max 5 MB)" }, { status: 413 })
  }

  // Validate extension — strip path components from original name first
  const originalName = path.basename(file.name)
  const ext = path.extname(originalName).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ success: false, error: "Only JPG, PNG, WEBP and GIF images are allowed" }, { status: 415 })
  }

  // Generate a random safe filename — never use the user-supplied name
  const safeFilename = `${crypto.randomUUID()}${ext}`

  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), "public", "products")
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  // Resolve the final path and verify it stays inside uploadDir (belt-and-suspenders)
  const filePath = path.resolve(uploadDir, safeFilename)
  if (!filePath.startsWith(path.resolve(uploadDir))) {
    return NextResponse.json({ success: false, error: "Invalid file path" }, { status: 400 })
  }

  fs.writeFileSync(filePath, buffer)
  return NextResponse.json({ success: true, path: `/products/${safeFilename}` })
}
