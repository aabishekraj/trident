import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import SiteSettings from "@/models/SiteSettings"
import { getAdminSession, checkPermission } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  const err = checkPermission(req, "settings")
  if (err) return NextResponse.json({ error: err.error }, { status: err.status })

  await connectDB()
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

  const {
    promoBannerMessages,
    currency,
    shippingFreeThreshold,
    shippingFlatRate,
    shippingCountryRates,
    taxRate,
  } = body as {
    promoBannerMessages?: unknown
    currency?: unknown
    shippingFreeThreshold?: unknown
    shippingFlatRate?: unknown
    shippingCountryRates?: unknown
    taxRate?: unknown
  }

  // Validate promoBannerMessages
  if (promoBannerMessages !== undefined && !Array.isArray(promoBannerMessages)) {
    return NextResponse.json({ error: "promoBannerMessages must be an array" }, { status: 400 })
  }

  // Validate currency
  if (currency !== undefined && !["USD", "INR", "EUR"].includes(currency as string)) {
    return NextResponse.json({ error: "currency must be USD, INR, or EUR" }, { status: 400 })
  }

  // Validate numeric fields
  if (shippingFreeThreshold !== undefined && (typeof shippingFreeThreshold !== "number" || shippingFreeThreshold < 0)) {
    return NextResponse.json({ error: "shippingFreeThreshold must be a non-negative number" }, { status: 400 })
  }
  if (shippingFlatRate !== undefined && (typeof shippingFlatRate !== "number" || shippingFlatRate < 0)) {
    return NextResponse.json({ error: "shippingFlatRate must be a non-negative number" }, { status: 400 })
  }
  if (taxRate !== undefined && (typeof taxRate !== "number" || taxRate < 0 || taxRate > 100)) {
    return NextResponse.json({ error: "taxRate must be between 0 and 100" }, { status: 400 })
  }

  // Validate shippingCountryRates
  if (shippingCountryRates !== undefined) {
    if (!Array.isArray(shippingCountryRates)) {
      return NextResponse.json({ error: "shippingCountryRates must be an array" }, { status: 400 })
    }
    for (const r of shippingCountryRates as unknown[]) {
      if (typeof (r as { country?: unknown }).country !== "string" || typeof (r as { rate?: unknown }).rate !== "number") {
        return NextResponse.json({ error: "Each shippingCountryRate must have country (string) and rate (number)" }, { status: 400 })
      }
    }
  }

  // Sanitize promoBannerMessages
  const sanitize = (arr: unknown[]): string[] =>
    arr
      .filter((s): s is string => typeof s === "string")
      .map(s => s.trim().replace(/<[^>]*>/g, "").slice(0, 200))
      .filter(s => s.length > 0)
      .slice(0, 20)

  await connectDB()
  let settings = await SiteSettings.findOne()
  if (!settings) settings = await SiteSettings.create({})

  if (promoBannerMessages !== undefined) settings.promoBannerMessages = sanitize(promoBannerMessages as unknown[])
  if (currency !== undefined) settings.currency = currency as "USD" | "INR" | "EUR"
  if (shippingFreeThreshold !== undefined) settings.shippingFreeThreshold = shippingFreeThreshold as number
  if (shippingFlatRate !== undefined) settings.shippingFlatRate = shippingFlatRate as number
  if (shippingCountryRates !== undefined) settings.shippingCountryRates = (shippingCountryRates as { country: string; rate: number }[])
  if (taxRate !== undefined) settings.taxRate = taxRate as number
  settings.updatedAt = new Date()
  await settings.save()

  return NextResponse.json({ success: true, data: settings })
}
