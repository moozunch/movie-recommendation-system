"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Import Tabel kita
import { Movie, columns } from "@/components/movie-table/columns"
import { DataTable } from "@/components/movie-table/data-table"

export default function Home() {
  // Ubah tipe datanya bukan string[] lagi, tapi Movie[]
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")

  const handleGetRecommendation = async () => {
    if (!query) return alert("Ketik judul film dulu dong!")

    setLoading(true)
    try {
      // GANTI URL INI DENGAN URL PUBLIC KAMU
      const baseUrl = "https://animated-broccoli-gjppwjvrwq9f9rx9-8000.app.github.dev" 
      const res = await fetch(`${baseUrl}/recommend?movie_title=${query}`)
      
      const data = await res.json()
      console.log("Data:", data)
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error(error)
      alert("Gagal konek backend!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen items-center justify-center gap-6 bg-slate-50 px-4">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 text-center">
        🎬 Movie Recommender Pro
      </h1>
      
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input 
          type="text" 
          placeholder="Ketik judul (Avengers, Horror, Love)..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={handleGetRecommendation} disabled={loading}>
          {loading ? "🔍..." : "Cari"}
        </Button>
      </div>

      {/* TAMPILKAN TABEL DISINI */}
      <div className="w-full max-w-2xl">
         <DataTable columns={columns} data={recommendations} />
      </div>

    </div>
  )
}