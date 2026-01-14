"use client"

import { X, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface SelectedMovie {
  id: number
  title: string
  year: number | null
  poster_path: string | null
  vote_average: number
}

interface SelectedMovieCardProps {
  movie: SelectedMovie
  onRemove: (id: number) => void
}

export function SelectedMovieCard({ movie, onRemove }: SelectedMovieCardProps) {
  return (
    <Card className="relative w-full flex-row items-start gap-4 p-3 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors group overflow-hidden rounded-lg">
      {/* Poster */}
      <div className="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-zinc-800">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Movie Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white break-words line-clamp-2">
          {movie.title}
        </h4>
        {/* Fixed rating row under title */}
        <div className="mt-1 flex items-center gap-2">
          {movie.vote_average > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
              <Star className="w-3.5 h-3.5 fill-current text-yellow-400" />
              {movie.vote_average.toFixed(1)}
            </span>
          )}
          {movie.year && (
            <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-800">
              {movie.year}
            </Badge>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(movie.id)}
        className="absolute top-2 right-2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Remove movie"
      >
        <X className="h-3 w-3" />
      </button>
    </Card>
  )
}