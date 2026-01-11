"use client"

import Link from "next/link"
import { Github, Linkedin, Link as LinkIcon } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function AppNav() {
  return (
    <header className="w-full flex justify-center py-4 overflow-visible bg-background">
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/" className="inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-[color,box-shadow]">
                Guess Movie
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">About</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid gap-6 w-[300px] md:w-[600px] md:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <div className="text-sm font-semibold">Movie Recommender</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Built to explore explainable AI recommendations with a modern dark UI.
                  </p>
                </div>
                <ul className="grid gap-3">
                  <li>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="font-medium">Purpose</div>
                      <p className="text-sm text-muted-foreground">
                        Select favorites and get explainable suggestions.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="font-medium">How it works</div>
                      <p className="text-sm text-muted-foreground">
                        TF‑IDF vectors + user centroid + cosine similarity.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="font-medium">Credits</div>
                      <p className="text-sm text-muted-foreground">
                        TMDB data, shadcn/ui components, Plus Jakarta Sans font.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="font-medium">Social</div>
                      <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                        <Link href="https://github.com/moozunch" target="_blank" className="inline-flex items-center gap-1 hover:text-white">
                          <Github className="h-4 w-4" />
                          GitHub
                        </Link>
                        <Link href="https://www.linkedin.com/in/annisa-putri-aprilia-7070b9299/" target="_blank" className="inline-flex items-center gap-1 hover:text-white">
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </Link>
                        <Link href="https://annisa-portofolio-v3.vercel.app/" target="_blank" className="inline-flex items-center gap-1 hover:text-white">
                          <LinkIcon className="h-4 w-4" />
                          Portfolio
                        </Link>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  )
}
