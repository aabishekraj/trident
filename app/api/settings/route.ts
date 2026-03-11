import { NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import SiteSettings from "@/models/SiteSettings"

// Public read — used by PromoBanner on storefront
export async function GET() {
  try {
    await dbConnect()
    let settings = await SiteSettings.findOne().lean()
    if (!settings) {
      const created = await SiteSettings.create({})
      settings = created.toObject()
    }
    return NextResponse.json({
      success: true,
      data: { promoBannerMessages: (settings as ISiteSettingsLean).promoBannerMessages },
    })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

type ISiteSettingsLean = { promoBannerMessages: string[] }
