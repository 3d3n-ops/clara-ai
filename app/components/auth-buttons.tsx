"use client"

import { Button } from "@/components/ui/button"
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AuthButtons() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      // Check if user has completed onboarding by checking localStorage
      const onboardingData = localStorage.getItem("onboardingData")
      const userFolders = localStorage.getItem("userFolders")
      
      // If user has completed onboarding (has onboarding data or folders), go to dashboard
      if (onboardingData || userFolders) {
        router.push("/dashboard")
      } else {
        // Only redirect to onboarding if they haven't completed it
        router.push("/onboarding")
      }
    }
  }, [isSignedIn, router])

  if (isSignedIn) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">Welcome, {user.firstName}!</span>
        <UserButton afterSignOutUrl="/" />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <SignInButton mode="modal">
        <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
          Sign in
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">Register</Button>
      </SignUpButton>
    </div>
  )
}
