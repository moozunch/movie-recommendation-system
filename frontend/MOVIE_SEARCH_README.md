# Movie Search with Autocomplete Component

A professional, dark-themed movie search component with real-time autocomplete functionality for Next.js 14 applications.

## 🎨 Features

- ✨ **Real-time autocomplete** - Search movies as you type
- ⏱️ **Debounced API calls** - 300ms delay to prevent API spam
- 🌙 **Dark mode by default** - Vercel/GitHub inspired dark theme
- 🎬 **Movie year disambiguation** - Easily distinguish between movies with the same name
- ⭐ **Rating display** - Shows TMDB vote averages
- 🔄 **Loading states** - Visual feedback with spinner during search
- ♿ **Accessible** - Built with shadcn/ui components
- 📱 **Responsive** - Works on all screen sizes

## 📦 Installation

The component has already been installed in your project with all necessary dependencies:

- ✅ shadcn/ui Command component
- ✅ useDebounce hook
- ✅ Backend search endpoint

## 📁 File Structure

```
frontend/
├── components/
│   ├── movie-search.tsx          # Main MovieSearch component
│   └── ui/
│       ├── command.tsx            # shadcn Command component
│       └── dialog.tsx             # Required by Command
├── lib/
│   └── hooks/
│       └── useDebounce.ts         # Custom debounce hook
└── app/
    └── page.tsx                   # Example usage
```

## 🚀 Usage

### Basic Usage

```tsx
import { MovieSearch, Movie } from "@/components/movie-search"

export default function MyPage() {
  const handleMovieSelect = (movie: Movie) => {
    console.log("Selected movie:", movie)
    // Fetch recommendations, navigate, etc.
  }

  return (
    <MovieSearch 
      onSelectMovie={handleMovieSelect}
      placeholder="Search for a movie..."
    />
  )
}
```

### Movie Type

```typescript
interface Movie {
  id: number
  title: string
  year: number | null
  poster_path: string | null
  vote_average: number
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSelectMovie` | `(movie: Movie) => void` | **Required** | Callback when user selects a movie |
| `placeholder` | `string` | `"Search for a movie..."` | Input placeholder text |
| `className` | `string` | `""` | Additional CSS classes |

## 🎨 Styling

The component uses a dark theme with:
- **Background**: `slate-900` / `slate-950`
- **Borders**: `slate-800`
- **Text**: `white` / `slate-400`
- **Hover**: `slate-800`

### Customization Example

```tsx
<MovieSearch 
  onSelectMovie={handleMovieSelect}
  className="max-w-2xl mx-auto"
  placeholder="Find your favorite movie..."
/>
```

## 🔧 Backend Configuration

The component expects a backend endpoint at:

```
GET /search?query={searchTerm}
```

**Response format:**
```json
{
  "query": "avatar",
  "results": [
    {
      "id": 19995,
      "title": "Avatar",
      "year": 2009,
      "poster_path": "/path.jpg",
      "vote_average": 7.6
    }
  ]
}
```

**Change backend URL** in [movie-search.tsx](frontend/components/movie-search.tsx):

```typescript
const BACKEND_URL = "https://your-backend-url.com"
```

## 🎯 Features Explained

### 1. Debouncing
The component waits 300ms after the user stops typing before making an API call. This prevents unnecessary requests and improves performance.

```typescript
const debouncedQuery = useDebounce(query, 300)
```

### 2. Loading States
- Spinner appears in the input while fetching
- "Searching movies..." message in dropdown

### 3. Selected State
Once a movie is selected, it displays in a compact card with an "X" button to clear.

### 4. Year Disambiguation
Movies show their release year to help users distinguish between remakes and same-name films:
- Avatar (2009)
- Avatar: The Way of Water (2022)

## 🐛 Troubleshooting

### API Errors
Check browser console for fetch errors. Ensure:
1. Backend is running
2. CORS is properly configured
3. `/search` endpoint exists

### Styling Issues
The component expects Tailwind CSS with slate colors. Ensure your [tailwind.config.ts](frontend/tailwind.config.ts) includes slate colors.

### Component Not Showing
Verify shadcn/ui Command component is installed:
```bash
npx shadcn@latest add command
```

## 📝 Example Implementation

See [app/page.tsx](frontend/app/page.tsx) for a complete working example with:
- Movie search
- Recommendation fetching
- Loading states
- Results display

## 🎓 Key Concepts

- **Controlled Input**: The search query is managed by React state
- **Portal Dropdown**: Results appear in an absolutely positioned dropdown
- **Keyboard Navigation**: Use arrow keys to navigate, Enter to select
- **Click Outside**: Dropdown closes when clicking outside (with delay for selection)

## 🔗 Related Components

- `useDebounce` - Custom hook for debouncing values
- `Command` - shadcn/ui command palette component
- `MovieTable` - Display recommendations in a table

---

**Built with:**
- Next.js 14 (App Router)
- Tailwind CSS
- shadcn/ui
- Lucide React Icons
- TypeScript
