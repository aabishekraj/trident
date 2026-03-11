"use client"

import { useState } from "react"
import Image from "next/image"
import { useCart } from "@/context/CartContext"
import { useCurrency } from "@/context/CurrencyContext"

type Product = {
  id: string
  name: string
  price: number
  description: string
  images: string[]
}

export default function ProductView({ product }: { product: Product }) {

  const { addToCart } = useCart()
  const { fmt } = useCurrency()

  const [selectedImage, setSelectedImage] = useState(product.images[0])
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  const sizes = ["S", "M", "L", "XL"]

  const handleAddToCart = () => {

    if (!selectedSize) {
      alert("Please select a size")
      return
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: selectedSize,
      quantity: 1
    })
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 px-10">

      <div className="grid lg:grid-cols-2 gap-20 max-w-7xl mx-auto">

        {/* IMAGE GALLERY */}
        <div className="flex gap-6">

          {/* thumbnails */}
          <div className="flex flex-col gap-4">

            {product.images.map((img) => (

              <button
                key={img}
                onClick={() => setSelectedImage(img)}
                className={`border ${
                  selectedImage === img
                    ? "border-white"
                    : "border-neutral-700"
                }`}
              >
                <Image
                  src={img}
                  alt="thumb"
                  width={70}
                  height={70}
                />
              </button>

            ))}

          </div>

          {/* main image */}
          <div className="relative group w-full max-w-lg">

            <Image
              src={selectedImage}
              alt={product.name}
              width={600}
              height={600}
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />

          </div>

        </div>

        {/* PRODUCT INFO */}
        <div>

          <h1 className="text-4xl font-bold mb-4">
            {product.name}
          </h1>

          <p className="text-xl mb-6">
            {fmt(product.price)}
          </p>

          <p className="text-neutral-400 mb-10">
            {product.description}
          </p>

          {/* SIZE SELECTOR */}

          <h3 className="mb-4 font-semibold">
            Select Size
          </h3>

          <div className="grid grid-cols-4 gap-4 mb-10">

            {sizes.map((size) => (

              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`border py-3 ${
                  selectedSize === size
                    ? "border-white bg-white text-black"
                    : "border-neutral-700"
                }`}
              >
                {size}
              </button>

            ))}

          </div>

          {/* ADD TO CART */}

          <button
            onClick={handleAddToCart}
            className="w-full bg-white text-black py-4 font-semibold hover:bg-neutral-200 transition"
          >
            Add to Cart
          </button>

        </div>

      </div>

    </div>
  )
}