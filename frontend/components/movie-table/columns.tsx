"use client"

import { ColumnDef } from "@tanstack/react-table"

export type Movie = {
  title: string
  genre: string
  rating: number
  year: number
}

export const columns: ColumnDef<Movie>[] = [
  {
    accessorKey: "title",
    header: "Movie Title", // English
  },
  {
    accessorKey: "genre",
    header: "Genre",
  },
  {
    accessorKey: "year",
    header: "Year", // English
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      // Color coded rating
      const rating = parseFloat(row.getValue("rating"))
      return (
        <div className={`font-bold ${rating >= 8 ? "text-green-600" : "text-slate-600"}`}>
          {rating.toFixed(1)} / 10
        </div>
      )
    },
  },
]