import mongoose from "mongoose"

const ProductSchema = new mongoose.Schema({

  name: String,

  price: Number,

  description: String,

  images: [String],

  category: String,

  stock: Number

})

export default mongoose.models.Product ||
mongoose.model("Product", ProductSchema)