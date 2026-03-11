import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import SiteSettings from "@/models/SiteSettings"
import { getAdminSession, checkPermission } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  const err = checkPermission(req, "settings")
  if (err) return NextResponse.json({ error: err.error }, { status: err.status })

  await dbConnect()
  let settings = await SiteSettings.findOne().lean()
  if (!settings) {
    const created = await SiteSettings.create({})
    settings = created.toObject()
  }
  return NextResponse.json({ success: true, data: settings })
}

export async function PUT(req: NextRequest) {
  const session = getAdminSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const err = checkPermission(req, "settings")
  if (err) return NextResponse.json({ error: err.error }, { status: err.status })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { promoBannerMessages } = body as { promoBannerMessages?: unknown }

  if (promoBannerMessages !== undefined && !Array.isArray(promoBannerMessages)) {
    return NextResponse.json({ error: "promoBannerMessages must be an array" }, { status: 400 })
  }

  // Sanitize: strings only, max 200 chars each, max 20 items, no HTML tags
  const sanitize = (arr: unknown[]): string[] =>
    arr
      .filter((s): s is string => typeof s === "string")
      .map(s => s.trim().replace(/<[^>]*>/g, "").slice(0, 200))
      .filter(s => s.length > 0)
      .slice(0, 20)

  await dbConnect()
  let settings = await SiteSettings.findOne()
  if (!settings) settings = await SiteSettings.create({})

  if (promoBannerMessages) settings.promoBannerMessages = sanitize(promoBannerMessages as unknown[])
  settings.updatedAt = new Date()
  await settings.save()

  return NextResponse.json({ success: true, data: settings })
}
