import type { Metadata } from "next"
import { Inter, Instrument_Serif } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { PostHogProvider } from "../components/PostHogProvider"

const inter = Inter({ subsets: ["latin"] })
const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif"
})

export const metadata: Metadata = {
  title: "Clara.ai - Your AI Learning Assistant",
  description: "Supercharge your learning with Clara, your AI-powered study assistant",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className={`${inter.className} ${instrumentSerif.variable} h-full antialiased`}>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}