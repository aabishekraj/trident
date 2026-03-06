"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginPage(){

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  const handleAdminLogin = async () => {

    await signIn("credentials",{
      email,
      password,
      callbackUrl:"/admin"
    })

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <div className="w-105 border border-neutral-800 p-10">

        <h1 className="text-2xl font-bold mb-8">
          Login
        </h1>

        {/* GOOGLE LOGIN */}

        <button
          onClick={()=>signIn("google")}
          className="w-full bg-white text-black py-3 font-semibold mb-6"
        >
          Continue with Google
        </button>

        <div className="text-neutral-400 text-center mb-6">
          Admin Login
        </div>

        <input
          placeholder="Admin Email"
          className="w-full bg-black border border-neutral-700 p-3 mb-3"
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full bg-black border border-neutral-700 p-3 mb-6"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={handleAdminLogin}
          className="w-full border border-white py-3 hover:bg-white hover:text-black"
        >
          Login as Admin
        </button>

      </div>

    </div>

  )
}