"use client"

import { useState } from "react"
import { Movie as TableMovie, columns } from "@/components/movie-table/columns"
import { DataTable } from "@/components/movie-table/data-table"
import { Loader2, Clapperboard, Sparkles, Search as SearchIcon } from "lucide-react"
import { MovieSearch, Movie as SearchMovie } from "@/components/movie-search"
import { SelectedMovieCard } from "@/components/selected-movie-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Ganti URL ini jika environment berubah
const BACKEND_URL = "https://animated-broccoli-gjppwjvrwq9f9rx9-8000.app.github.dev"
const MAX_SELECTIONS = 3

export default function Home() {
  // Single search state
  const [recommendations, setRecommendations] = useState<TableMovie[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<SearchMovie | null>(null)
  
  // Multi-movie taste profile state
  const [selectedMovies, setSelectedMovies] = useState<SearchMovie[]>([])
  const [tasteLoading, setTasteLoading] = useState(false)
  const [tasteRecommendations, setTasteRecommendations] = useState<TableMovie[]>([])

  // --- HELPER: Data Cleaning ---
  // Fungsi ini memastikan data dari API sesuai dengan format Tabel
  const mapToTableData = (rawRecs: any[]): TableMovie[] => {
    return (rawRecs || []).map((rec: any) => ({
      title: rec.title,
      year: rec.year,
      rating: rec.rating,
      genres: rec.genres || ["Movie"], // Default value
      reason: rec.reason,             // Ambil alasan AI
      match_score: rec.match_score    // Ambil score
    }))
  }

  // --- HANDLER: Single Search (FIXED) ---
  const handleMovieSelect = async (movie: SearchMovie) => {
    setSelectedMovie(movie)
    setLoading(true)
    
    try {
      // 🔄 FIX: Sekarang pakai endpoint v2 (POST) biar lebih cerdas
      // Kita bungkus 1 film ini ke dalam array
      const res = await fetch(`${BACKEND_URL}/recommend/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titles: [movie.title]
        })
      })

      const data = await res.json()

      if (!res.ok) {
         throw new Error(data.detail || 'Failed to get recommendations')
      }
      
      // Map data biar aman
      const cleanData = mapToTableData(data.recommendations)
      setRecommendations(cleanData)

    } catch (error) {
      console.error(error)
      alert("Failed to connect to backend or find movie")
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  // --- HANDLER: Multi-Movie Selection ---
  const handleAddMovie = (movie: SearchMovie) => {
    if (selectedMovies.some(m => m.id === movie.id)) {
      alert("This movie is already in your selection!")
      return
    }
    if (selectedMovies.length >= MAX_SELECTIONS) {
      alert(`You can only select up to ${MAX_SELECTIONS} movies!`)
      return
    }
    setSelectedMovies(prev => [...prev, movie])
  }

  const handleRemoveMovie = (id: number) => {
    setSelectedMovies(prev => prev.filter(m => m.id !== id))
  }

  const handleAnalyzeTaste = async () => {
    if (selectedMovies.length === 0) {
      alert("Please select at least one movie!")
      return
    }

    setTasteLoading(true)
    
    try {
      const movieTitles = selectedMovies.map(m => m.title)
      
      const res = await fetch(`${BACKEND_URL}/recommend/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titles: movieTitles
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to get recommendations')
      }
      
      // Map data biar aman
      const cleanData = mapToTableData(data.recommendations)
      setTasteRecommendations(cleanData)

    } catch (error) {
      console.error(error)
      alert(`Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTasteRecommendations([])
    } finally {
      setTasteLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center py-20 gap-8 bg-black px-4">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-white">
          <Clapperboard className="h-10 w-10" />
          <h1 className="text-4xl font-bold tracking-tight">
            Movie Recommender
          </h1>
        </div>
        <p className="text-zinc-500">
          Powered by AI & TMDB API
        </p>
      </div>
      
      {/* Tabs Navigation */}
      <Tabs defaultValue="single" className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 border border-zinc-800">
          <TabsTrigger 
            value="single"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            <SearchIcon className="h-4 w-4 mr-2" />
            Single Search
          </TabsTrigger>
          <TabsTrigger 
            value="curate"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Curate My Taste
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Single Search */}
        <TabsContent value="single" className="mt-6 space-y-6">
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-lg">
              <MovieSearch onSelectMovie={handleMovieSelect} />
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-zinc-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Finding recommendations...</span>
              </div>
            )}

            {selectedMovie && !loading && recommendations.length > 0 && (
              <div className="w-full">
                <div className="mb-4 text-center">
                  <h2 className="text-xl font-semibold text-white">
                    Recommendations for{" "}
                    <span className="text-blue-500">{selectedMovie.title}</span>
                    {selectedMovie.year && (
                      <span className="text-zinc-500"> ({selectedMovie.year})</span>
                    )}
                  </h2>
                </div>
                <DataTable columns={columns} data={recommendations} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Curate My Taste */}
        <TabsContent value="curate" className="mt-6 space-y-6">
          <div className="flex flex-col items-center gap-6">
            <Card className="w-full max-w-2xl p-6 bg-zinc-900/30 border-zinc-800">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Build Your Taste Profile
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Select up to {MAX_SELECTIONS} movies that represent your taste. 
                    Our AI will analyze your preferences and recommend movies tailored to your unique profile.
                  </p>
                </div>
              </div>
            </Card>

            <div className="w-full max-w-lg">
              <MovieSearch 
                onSelectMovie={handleAddMovie}
                placeholder="Search and add movies to your taste profile..."
              />
            </div>

            {selectedMovies.length > 0 && (
              <div className="w-full max-w-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zinc-400">
                    Your Selected Movies ({selectedMovies.length}/{MAX_SELECTIONS})
                  </h3>
                  {selectedMovies.length === MAX_SELECTIONS && (
                    <span className="text-xs text-zinc-500">
                      Maximum reached
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedMovies.map((movie) => (
                    <SelectedMovieCard
                      key={movie.id}
                      movie={movie}
                      onRemove={handleRemoveMovie}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleAnalyzeTaste}
                  disabled={tasteLoading || selectedMovies.length === 0}
                  className="w-full mt-6 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all"
                  size="lg"
                >
                  {tasteLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Your Taste...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Analyze My Taste & Recommend
                    </>
                  )}
                </Button>
              </div>
            )}

            {!tasteLoading && tasteRecommendations.length > 0 && (
              <div className="w-full">
                <div className="mb-4 text-center">
                  <h2 className="text-xl font-semibold text-white">
                    Personalized Recommendations
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Based on {selectedMovies.map(m => m.title).join(", ")}
                  </p>
                </div>
                <DataTable columns={columns} data={tasteRecommendations} />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}