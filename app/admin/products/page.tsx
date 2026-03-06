"use client"

import { useEffect, useState } from "react"

export default function AdminProducts() {

  const [products, setProducts] = useState<any[]>([])
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const fetchProducts = async () => {
    const res = await fetch("/api/products")
    const data = await res.json()
    setProducts(data)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const addProduct = async () => {
    let imagePath = image

    if (file) {
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const uploadData = await uploadRes.json()
      imagePath = uploadData.path
    }

    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price, image: imagePath }),
    })

    setName("")
    setPrice("")
    setImage("")
    setFile(null)
    fetchProducts()
  }

  const deleteProduct = async (id: string) => {
    await fetch(`/api/products/${id}`, { method: "DELETE" })
    fetchProducts()
  }

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">Admin Products</h1>

      {/* Add Product */}
      <div className="mb-10 space-y-2">

        <input
          className="border p-2 w-full"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={addProduct}
          className="bg-black text-white px-4 py-2"
        >
          Add Product
        </button>

      </div>

      {/* Product List */}
      <table className="w-full border">
        <thead>
          <tr className="border">
            <th>Name</th>
            <th>Price</th>
            <th>Image</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="border text-center">
              <td>{p.name}</td>
              <td>${p.price}</td>
              <td>{p.image}</td>
              <td>
                <button
                  onClick={() => deleteProduct(p._id)}
                  className="bg-red-500 text-white px-3 py-1"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}