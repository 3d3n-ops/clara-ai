"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    
    if (!posthogKey) {
      console.warn("PostHog key not found. Analytics will be disabled.")
      return
    }

    try {
      posthog.init(posthogKey, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: '2025-05-24',
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
      })
    } catch (error) {
      console.error("Failed to initialize PostHog:", error)
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}