"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Search, Loader2, X } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useDebounce } from "@/lib/hooks/useDebounce"

export interface Movie {
  id: number
  title: string
  year: number | null
  poster_path: string | null
  vote_average: number
}

interface MovieSearchProps {
  onSelectMovie: (movie: Movie) => void
  placeholder?: string
  className?: string
}

const BACKEND_URL = "https://animated-broccoli-gjppwjvrwq9f9rx9-8000.app.github.dev"

export function MovieSearch({
  onSelectMovie,
  placeholder = "Search for a movie...",
  className = "",
}: MovieSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  // Debounce the search query
  const debouncedQuery = useDebounce(query, 300)

  // Fetch movies when debounced query changes
  React.useEffect(() => {
    const fetchMovies = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setMovies([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(
          `${BACKEND_URL}/search?query=${encodeURIComponent(debouncedQuery)}`
        )
        const data = await response.json()
        setMovies(data.results || [])
      } catch (error) {
        console.error("Error fetching movies:", error)
        setMovies([])
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [debouncedQuery])

  const handleSelect = useCallback(
    (movie: Movie) => {
      setSelectedMovie(movie)
      setQuery("")
      setOpen(false)
      setMovies([])
      onSelectMovie(movie)
    },
    [onSelectMovie]
  )

  const handleClear = useCallback(() => {
    setSelectedMovie(null)
    setQuery("")
    setMovies([])
  }, [])

  return (
    <div className={`relative w-full ${className}`}>
      {selectedMovie ? (
        // Selected movie display
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-white">
          <Search className="h-5 w-5 text-zinc-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {selectedMovie.title}
              {selectedMovie.year && (
                <span className="ml-2 text-zinc-500">({selectedMovie.year})</span>
              )}
            </p>
          </div>
          <button
            onClick={handleClear}
            className="rounded-md p-1 hover:bg-zinc-900 transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
      ) : (
        // Search input with dropdown
        <Command
          className="rounded-lg border border-zinc-800 bg-zinc-950 text-white shadow-md overflow-visible"
          shouldFilter={false}
        >
          <div className="flex items-center px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-zinc-500" />
            <CommandInput
              placeholder={placeholder}
              value={query}
              onValueChange={(value) => {
                setQuery(value)
                setOpen(value.length > 0)
              }}
              onFocus={() => setOpen(query.length > 0)}
              onBlur={(e) => {
                // Only close if clicking outside the command component
                const relatedTarget = e.relatedTarget as HTMLElement
                if (!relatedTarget || !relatedTarget.closest('[data-slot="command-list"]')) {
                  setTimeout(() => setOpen(false), 200)
                }
              }}
              className="flex h-12 w-full bg-transparent py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-0"
            />
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-zinc-500" />
            )}
          </div>

          {open && (query.length > 0) && (
            <CommandList 
              className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[300px] overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 shadow-lg scrollbar-thin scrollbar-track-zinc-950 scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-700"
              onMouseDown={(e) => {
                // Prevent blur when interacting with dropdown/scrollbar
                e.preventDefault()
              }}
            >              {loading ? (
                <div className="py-6 text-center text-sm text-zinc-500">
                  Searching movies...
                </div>
              ) : movies.length === 0 && debouncedQuery ? (
                <CommandEmpty className="py-6 text-center text-sm text-zinc-500">
                  No movies found.
                </CommandEmpty>
              ) : movies.length > 0 ? (
                <CommandGroup>
                  {movies.map((movie) => (
                    <CommandItem
                      key={movie.id}
                      value={`${movie.title}-${movie.id}`}
                      onSelect={() => handleSelect(movie)}
                      className="group flex cursor-pointer items-center gap-3 px-3 py-2.5 my-1 mx-1 rounded-md text-zinc-200 transition-all duration-200 ease-in-out hover:!bg-zinc-900/40 hover:!text-zinc-100 hover:outline hover:outline-1 hover:outline-zinc-700 aria-selected:!bg-zinc-900/40 aria-selected:!text-zinc-100 aria-selected:outline aria-selected:outline-1 aria-selected:outline-zinc-700"
                    >
                      {/* Poster Image */}
                      <div className="flex-shrink-0 w-10 h-14 rounded overflow-hidden bg-zinc-800">
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
                        <p className="text-sm font-medium truncate">
                          {movie.title}
                          {movie.year && (
                            <span className="ml-2 text-zinc-400 group-hover:text-zinc-300">
                              ({movie.year})
                            </span>
                          )}
                        </p>
                        {movie.vote_average > 0 && (
                          <p className="text-xs text-zinc-500 group-hover:text-zinc-400">
                            ⭐ {movie.vote_average.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          )}
        </Command>
      )}
    </div>
  )
}
