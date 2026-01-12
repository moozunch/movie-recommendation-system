"use client"

import { useMemo, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

export default function FeedbackPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const inferApiBase = () => {
    if (typeof window === "undefined") return "http://localhost:8000"
    const origin = window.location.origin
    // GitHub Codespaces/app.github.dev: map -3000 to -8000
    if (origin.includes(".app.github.dev")) {
      return origin.replace("-3000", "-8000")
    }
    try {
      const u = new URL(origin)
      if (u.port) {
        return `${u.protocol}//${u.hostname}:8000`
      }
    } catch {}
    return "http://localhost:8000"
  }
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE as string)
    || (process.env.NEXT_PUBLIC_BACKEND_URL as string)
    || inferApiBase()

  const isValid = useMemo(() => {
    const emailOk = /.+@.+\..+/.test(email.trim())
    const msgOk = message.trim().length > 0
    return emailOk && msgOk
  }, [email, message])

  const mailtoHref = useMemo(() => {
    const to = "annisaputriaprilia12@gmail.com"
    const subject = encodeURIComponent("App Feedback")
    const body = encodeURIComponent(`From: ${email}\n\n${message}`)
    return `mailto:${to}?subject=${subject}&body=${body}`
  }, [email, message])

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
          <CardDescription>
            Share your thoughts to improve the app experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={email.length > 0 && !/.+@.+\..+/.test(email)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <Textarea
                id="message"
                placeholder="Write your feedback here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!isValid}>Send</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your message will be sent to the maintainer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_BASE}/api/feedback`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, message }),
                      })
                      const data = await res.json()
                      if (res.ok) {
                        toast.success("Feedback sent. Thank you!")
                        setEmail("")
                        setMessage("")
                      } else {
                        toast.error(data?.detail || "Failed to send feedback.")
                      }
                    } catch (e) {
                      toast.error("Network error. Please try again later.")
                    }
                  }}
                >
                  Send
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  )
}
