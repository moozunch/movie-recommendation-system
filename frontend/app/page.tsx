"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Fungsi untuk memanggil Backend Python
  const handleGetRecommendation = async () => {
    setLoading(true)
    try {
      // ⚠️ PASTIKAN URL INI BENAR (Harus diakhiri /recommend?...)
      // Ganti URL_PANJANG_KAMU dengan url dari Port 8000
      const res = await fetch("https://animated-broccoli-gjppwjvrwq9f9rx9-8000.app.github.dev/recommend?movie_title=Avengers")
      
      const data = await res.json()
      
      // CEK DATA DI CONSOLE (Biar kita tau isi aslinya apa)
      console.log("Data dari Backend:", data)

      // PERBAIKAN: Pakai "|| []" (Kalau undefined, ganti jadi array kosong)
      setRecommendations(data.recommendations || []) 
      
    } catch (error) {
      console.error("Gagal mengambil data:", error)
      alert("Ada error! Cek Console (F12) untuk detailnya.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen items-center justify-center gap-6 bg-slate-50">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">
        Movie Recommender AI 🎬
      </h1>
      
      <div className="flex gap-4">
        {/* Tombol ini akan memicu fungsi di atas */}
        <Button onClick={handleGetRecommendation} disabled={loading}>
          {loading ? "Sedang Mikir..." : "Rekomendasi Film Avengers"}
        </Button>
      </div>

      {/* Bagian untuk menampilkan hasil */}
      {recommendations.length > 0 && (
        <div className="p-4 border rounded-lg bg-white shadow-md w-full max-w-md">
          <h3 className="font-bold mb-2">Hasil Rekomendasi:</h3>
          <ul className="list-disc pl-5">
            {recommendations.map((movie, index) => (
              <li key={index} className="text-slate-700">{movie}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}