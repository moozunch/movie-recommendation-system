"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Star, TrendingUp, Info } from "lucide-react"

// 1. UPDATE TIPE DATA (Sesuai output Backend baru)
export type Movie = {
  title: string
  year: number
  rating: number
  genres?: string[]     // Dulu 'genre' (string), sekarang array string
  reason?: string       // Baru: Alasan dari AI
  match_score?: string  // Baru: Score (ex: "85%")
}

export const columns: ColumnDef<Movie>[] = [
  // --- KOLOM 1: JUDUL & GENRE ---
  {
    accessorKey: "title",
    header: "Movie Details",
    cell: ({ row }) => {
      const genres = row.original.genres || [] // Handle jika kosong
      
      return (
        <div className="flex flex-col gap-1.5 py-1">
          {/* Judul Film */}
          <span className="font-bold text-base text-zinc-100">
            {row.getValue("title")}
          </span>
          
          {/* Genre Pills (Maksimal 3) */}
          <div className="flex gap-1 flex-wrap">
            {genres.slice(0, 3).map((g) => (
              <span 
                key={g} 
                className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      )
    },
  },

  // --- KOLOM 2: TAHUN ---
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) => <span className="text-zinc-400 font-medium">{row.getValue("year")}</span>,
  },

  // --- KOLOM 3: RATING (Dengan Bintang) ---
  {
    accessorKey: "rating",
    header: "TMDB Rating",
    cell: ({ row }) => {
      const rating = parseFloat(row.getValue("rating"))
      // Logic warna rating
      let colorClass = "text-zinc-400"
      if (rating >= 8) colorClass = "text-green-400"
      else if (rating >= 6) colorClass = "text-yellow-400"

      return (
        <div className="flex items-center gap-1.5 font-medium">
          <Star className={`w-3.5 h-3.5 ${colorClass} fill-current`} />
          <span className={colorClass}>
            {rating.toFixed(1)}
          </span>
        </div>
      )
    },
  },

  // --- KOLOM 4: AI REASONING (Explainability) ---
  {
    accessorKey: "reason",
    header: () => (
      <div className="flex items-center gap-2 text-blue-400">
        <TrendingUp className="w-4 h-4" />
        AI Reasoning
      </div>
    ),
    cell: ({ row }) => {
      const reason = row.original.reason
      const scoreStr = row.original.match_score

      // Jika tidak ada reason (misal hasil search biasa), tampilkan strip
      if (!reason) return <span className="text-zinc-600 text-xs">-</span>

      // Parsing Score untuk pewarnaan Badge
      // Contoh: "85%" -> 85
      const scoreNum = parseInt(scoreStr?.replace("%", "") || "0")
      
      // Logic Warna Badge Match Score
      let badgeStyle = "bg-zinc-800 text-zinc-400 border-zinc-700" // Default (Low)
      if (scoreNum >= 80) badgeStyle = "bg-green-900/30 text-green-400 border-green-800" // High
      else if (scoreNum >= 50) badgeStyle = "bg-yellow-900/30 text-yellow-400 border-yellow-800" // Medium

      return (
        <div className="flex flex-col gap-2 max-w-[350px]">
          
          {/* Baris Atas: Badge Score */}
          {scoreStr && (
            <div className="flex">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeStyle}`}>
                {scoreStr} Match
              </span>
            </div>
          )}

          {/* Baris Bawah: Penjelasan Text */}
          <div className="flex gap-2 items-start">
             <Info className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
             <p className="text-xs text-zinc-400 italic leading-relaxed">
               "{reason}"
             </p>
          </div>
        </div>
      )
    },
  },
]