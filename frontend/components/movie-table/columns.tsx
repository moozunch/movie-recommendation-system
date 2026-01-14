"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Star, TrendingUp, Info } from "lucide-react"

// 1. UPDATE TIPE DATA (Sesuai output Backend baru)
export type Movie = {
  title: string
  year: number
  rating: number
  poster_path?: string | null
  genres?: string[]     // Dulu 'genre' (string), sekarang array string
  reason?: string       // Baru: Alasan dari AI
  match_score?: string  // Baru: Score (ex: "85%")
}

export const columns: ColumnDef<Movie>[] = [
  // --- KOLOM 1: JUDUL & GENRE ---
  {
    accessorKey: "title",
    header: "Movie",
    cell: ({ row }) => {
      const genres = row.original.genres || [] // Handle jika kosong
      const poster = row.original.poster_path
      const rating = row.original.rating as number
      
      return (
        <div className="flex items-start gap-3 py-2">
          <div className="flex-shrink-0 w-10 h-14 rounded overflow-hidden bg-zinc-800">
            {poster ? (
              <img
                src={`https://image.tmdb.org/t/p/w92${poster}`}
                alt={row.getValue("title")}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4-4a2 2 0 012 0l4 4m0 0l2-2a2 2 0 012 0l2 2M3 7h18" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 min-w-0 max-w-[520px]">
            <span className="font-bold text-base text-zinc-100 truncate">
              {row.getValue("title")}
            </span>
            {/* Rating star fixed under the title */}
            <div className="flex items-center gap-1.5">
              {Number.isFinite(rating) && (
                <>
                  <Star className={`w-3.5 h-3.5 ${rating >= 8 ? "text-green-400" : rating >= 6 ? "text-yellow-400" : "text-zinc-400"} fill-current`} />
                  <span className={`${rating >= 8 ? "text-green-400" : rating >= 6 ? "text-yellow-400" : "text-zinc-400"} text-sm`}>{rating.toFixed(1)}</span>
                </>
              )}
            </div>
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
  // Hapus kolom rating: sudah dipindahkan di bawah judul

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
        <div className="flex flex-col gap-2 max-w-[420px] break-words">
          
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
             <p className="text-xs text-zinc-400 italic leading-relaxed line-clamp-3">
               "{reason}"
             </p>
          </div>
        </div>
      )
    },
  },
]