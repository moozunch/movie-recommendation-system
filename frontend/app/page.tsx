import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col h-screen items-center justify-center gap-4">
      <h1 className="text-4xl font-bold tracking-tight">Movie Recommender AI</h1>
      <p className="text-muted-foreground">Project belajar Docker & Automation Testing</p>
      <div className="flex gap-2">
        <Button variant="default">Login</Button>
        <Button variant="outline">Lihat Demo</Button>
      </div>
    </div>
  )
}