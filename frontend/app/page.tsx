"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Movie, columns } from "@/components/movie-table/columns"
import { DataTable } from "@/components/movie-table/data-table"
import { Search, Loader2, Clapperboard } from "lucide-react" // Import Icons

export default function Home() {
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")

  const handleSearch = async () => {
    if (!query) return

    setLoading(true)
    try {
      const baseUrl = "https://moozunch-movie-recommendation-backend.hf.space"
      
      const res = await fetch(`${baseUrl}/recommend?title=${query}`)
      const data = await res.json()
      
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error(error)
      alert("Failed to connect to backend")
    } finally {
      setLoading(false)
    }
  }

  // Allow pressing "Enter" to search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center py-20 gap-8 bg-slate-50 px-4">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-slate-900">
          <Clapperboard className="h-10 w-10" />
          <h1 className="text-4xl font-bold tracking-tight">
            Movie Recommender
          </h1>
        </div>
        <p className="text-slate-600">
          Powered by AI & TMDB API
        </p>
      </div>
      
      {/* Search Section */}
      <div className="flex w-full max-w-lg items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border">
        <Search className="ml-2 h-5 w-5 text-slate-400" />
        <Input 
          type="text" 
          placeholder="Search for a movie (e.g., Inception)..." 
          className="border-none shadow-none focus-visible:ring-0"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {/* Results Section */}
      <div className="w-full max-w-4xl">
         <DataTable columns={columns} data={recommendations} />
      </div>
    </div>
  )
}