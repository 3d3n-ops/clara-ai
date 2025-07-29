import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/api/(.*)',
    '/dashboard/(.*)',
    '/chat/(.*)',
    '/onboarding/(.*)',
    '/study/(.*)',
    '/homework/(.*)',
    '/voice/(.*)',
    '/admin/(.*)',
  ],
}