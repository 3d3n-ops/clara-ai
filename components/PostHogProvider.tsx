"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
    
    if (!posthogKey) {
      console.warn("PostHog key not found. Analytics will be disabled.")
      return
    }

    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      try {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          ui_host: posthogHost,
          capture_exceptions: true,
          debug: process.env.NODE_ENV === "development",
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              posthog.debug()
            }
          }
        })
      } catch (error) {
        console.error("Failed to initialize PostHog:", error)
      }
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}