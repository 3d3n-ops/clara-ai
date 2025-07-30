import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { analytics, trackPageView } from '@/lib/analytics'

export function useAnalytics() {
  const { user, isSignedIn } = useUser()

  // Identify user when they sign in
  useEffect(() => {
    if (isSignedIn && user) {
      analytics.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      })
    }
  }, [isSignedIn, user])

  // Track page views automatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pageName = window.location.pathname
      trackPageView(pageName, {
        user_id: user?.id,
        is_signed_in: isSignedIn,
      })
    }
  }, [user?.id, isSignedIn])

  return {
    analytics,
    trackPageView,
    user,
    isSignedIn,
  }
}

// Hook for tracking specific page views
export function usePageView(pageName: string, properties?: Record<string, any>) {
  const { user, isSignedIn } = useUser()

  useEffect(() => {
    trackPageView(pageName, {
      user_id: user?.id,
      is_signed_in: isSignedIn,
      ...properties,
    })
  }, [pageName, user?.id, isSignedIn, properties])
}

// Hook for tracking user interactions
export function useUserTracking() {
  const { user, isSignedIn } = useUser()

  const trackUserAction = (eventName: string, properties?: Record<string, any>) => {
    analytics.track(eventName, {
      user_id: user?.id,
      is_signed_in: isSignedIn,
      ...properties,
    })
  }

  const trackSignIn = (properties?: Record<string, any>) => {
    if (user) {
      analytics.trackSignIn(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        ...properties,
      })
    }
  }

  const trackSignUp = (properties?: Record<string, any>) => {
    if (user) {
      analytics.trackSignUp(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        ...properties,
      })
    }
  }

  return {
    trackUserAction,
    trackSignIn,
    trackSignUp,
    user,
    isSignedIn,
  }
} 