"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import ProductCard from "@/components/ProductCard"

export default function HomePage() {

  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => setProducts(data))
  }, [])

  return (
    <main className="bg-black text-white">

      {/* HERO SECTION */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">

        <Image
          src="/hero/hero.jpg"
          alt="hero"
          fill
          priority
          className="object-cover opacity-60"
        />

        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />

        <div className="relative text-center max-w-4xl px-6">

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6">
            MOVE WITH
            <br />
            INTENT
          </h1>

          <p className="text-neutral-300 text-lg mb-10">
            Precision-engineered apparel built for performance and authority.
          </p>

          <div className="flex gap-6 justify-center">

            <Link
              href="/collection"
              className="bg-white text-black px-8 py-4 font-semibold hover:bg-neutral-200 transition"
            >
              Shop Men
            </Link>

            <Link
              href="/collection"
              className="border border-white px-8 py-4 hover:bg-white hover:text-black transition"
            >
              Shop Women
            </Link>

          </div>

        </div>

      </section>

      {/* FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-8 py-24">

        <h2 className="text-3xl font-bold mb-12">Featured Products</h2>

        <div className="grid md:grid-cols-3 gap-10">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              id={product._id}
              name={product.name}
              price={product.price}
              image={product.images?.[0] ?? product.image ?? ""}
            />
          ))}
        </div>

      </section>

    </main>
  )
}