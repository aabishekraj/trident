import "./globals.css"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import SmoothScroll from "@/components/SmoothScroll"
import Providers from "@/components/Providers"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400","500","600","700","800"],
})

export const metadata = {
  title: "TRIDENT",
  description: "Premium Performance Apparel",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en">

      <body className={`${inter.className} bg-black`}>

        <Providers>

          <SmoothScroll />

          <div className="flex flex-col min-h-screen">

            <Navbar />

            <main className="grow pt-24">
              {children}
            </main>

            <Footer />

          </div>

        </Providers>

      </body>

    </html>
  )
}