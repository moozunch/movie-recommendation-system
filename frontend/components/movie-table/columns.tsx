"use client"

import { ColumnDef } from "@tanstack/react-table"

// Ini bentuk data kita dari Python tadi
export type Movie = {
  title: string
  genre: string
  rating: number
  year: number
}

export const columns: ColumnDef<Movie>[] = [
  {
    accessorKey: "title",
    header: "Judul Film",
  },
  {
    accessorKey: "genre",
    header: "Genre",
  },
  {
    accessorKey: "year",
    header: "Tahun",
  },
  {
    accessorKey: "rating",
    header: "Rating",
    // Kita kasih style dikit biar angka rating ada di kanan
    cell: ({ row }) => {
      return <div className="font-bold text-orange-600">{row.getValue("rating")} / 10</div>
    },
  },
]