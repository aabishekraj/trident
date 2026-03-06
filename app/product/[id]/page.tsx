"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { useCart } from "@/context/CartContext"

export default function ProductPage(){

  const params = useParams()
  const { id } = params as { id:string }

  const { addToCart } = useCart()

  const [product,setProduct] = useState<any>(null)
  const [selectedImage,setSelectedImage] = useState("")
  const [size,setSize] = useState("M")

  useEffect(()=>{

    fetch("/api/products")
      .then(res=>res.json())
      .then(data=>{
        const p = data.find((item:any)=>item._id === id)
        setProduct(p)
        setSelectedImage(p?.image)
      })

  },[id])

  if(!product) return <div className="p-20">Loading...</div>

  const sizes = ["XS","S","M","L","XL"]

  return(

    <div className="max-w-7xl mx-auto px-8 py-24 grid md:grid-cols-2 gap-16">

      {/* IMAGE SECTION */}
      <div>

        <div className="mb-6">

          <Image
            src={selectedImage}
            alt={product.name}
            width={700}
            height={900}
            className="object-cover"
          />

        </div>

        {/* thumbnails */}
        <div className="flex gap-4">

          {[product.image].map((img:any)=>(
            <Image
              key={img}
              src={img}
              alt="thumb"
              width={100}
              height={120}
              className="cursor-pointer border"
              onClick={()=>setSelectedImage(img)}
            />
          ))}

        </div>

      </div>



      {/* PRODUCT INFO */}
      <div>

        <h1 className="text-3xl font-bold mb-4">
          {product.name}
        </h1>

        <p className="text-xl mb-6">
          ${product.price}
        </p>


        {/* SIZE SELECTOR */}

        <div className="mb-8">

          <p className="mb-3 font-semibold">
            Select Size
          </p>

          <div className="flex gap-3">

            {sizes.map((s)=>(
              <button
                key={s}
                onClick={()=>setSize(s)}
                className={`border px-4 py-2 ${
                  size===s
                    ? "bg-white text-black"
                    : "border-neutral-700"
                }`}
              >
                {s}
              </button>
            ))}

          </div>

        </div>


        {/* ADD TO CART */}

        <button
          onClick={()=>addToCart({
            ...product,
            size
          })}
          className="bg-white text-black px-10 py-4 font-semibold hover:bg-neutral-200 transition"
        >
          Add To Cart
        </button>


        {/* DESCRIPTION */}

        <div className="mt-10 text-neutral-400 leading-relaxed">

          <p>
            Built for movement and performance. Precision-engineered
            apparel designed to deliver comfort, durability, and
            style whether you're training or moving through the city.
          </p>

        </div>

      </div>

    </div>
  )
}