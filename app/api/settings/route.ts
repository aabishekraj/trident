import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import SiteSettings from "@/models/SiteSettings"

// Public read — used by PromoBanner and CurrencyContext on storefront
export async function GET() {
  try {
    await connectDB()
    let settings = await SiteSettings.findOne().lean()
    if (!settings) {
      const created = await SiteSettings.create({})
      settings = created.toObject()
    }
    const s = settings as typeof settings & {
      promoBannerMessages: string[]
      currency: string
      shippingFreeThreshold: number
      shippingFlatRate: number
      shippingCountryRates: { country: string; rate: number }[]
      taxRate: number
    }
    return NextResponse.json({
      success: true,
      data: {
        promoBannerMessages:  s.promoBannerMessages,
        currency:             s.currency,
        shippingFreeThreshold: s.shippingFreeThreshold,
        shippingFlatRate:     s.shippingFlatRate,
        shippingCountryRates: s.shippingCountryRates,
        taxRate:              s.taxRate,
      },
    })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
