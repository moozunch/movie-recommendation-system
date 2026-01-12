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
                    Ever wondered why an app suggests a movie? We fix that. This isn't just a random picker; it's an intelligent engine that understands your taste profile. We analyze plot keywords and hidden patterns to curate a list specifically for you.
                  </p>
                </div>
                <ul className="grid gap-3">
                  <li>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="font-medium">Purpose</div>
                      <p className="text-sm text-muted-foreground">
                        Stop scrolling, start watching. We solve "choice paralysis" by giving you recommendations that actually make sense.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="font-medium">How it works</div>
                      <p className="text-sm text-muted-foreground"> With TF‑IDF vectors + user centroid + cosine similarity, we convert movie plots into math (Vectors), calculate the "center" of your taste, and find the closest matches mathematically.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="font-medium">Credits</div>
                      <p className="text-sm text-muted-foreground">
                        Powered by TMDB API. UI components by shadcn/ui. Typeface: Plus Jakarta Sans.
                        Designed & Built by Annisa Putri Aprilia.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                      <div className="font-medium">Let's Connect</div>
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
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/feedback" className="inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-[color,box-shadow]">
                Feedback
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  )
}
