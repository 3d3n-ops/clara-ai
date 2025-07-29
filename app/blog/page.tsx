"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import { SignInButton } from "@clerk/nextjs"

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
  readTime: string
  category: string
  featured: boolean
  image: string
}

export default function BlogPage() {
  const blogPosts: BlogPost[] = [
    {
      id: "1",
      title: "The Science Behind Spaced Repetition: Why Clara.ai Uses This Proven Learning Method",
      excerpt:
        "Discover how spaced repetition can improve your memory retention by up to 200% and why it's at the core of Clara.ai's learning algorithms.",
      content: "",
      author: "Dr. Sarah Chen",
      publishedAt: "2024-01-15",
      readTime: "5 min read",
      category: "Learning Science",
      featured: true,
      image: "/placeholder.svg?height=300&width=600",
    },
    {
      id: "2",
      title: "5 Study Techniques That Actually Work (According to Research)",
      excerpt:
        "From active recall to the Feynman Technique, learn about evidence-based study methods that can transform your academic performance.",
      content: "",
      author: "Prof. Michael Rodriguez",
      publishedAt: "2024-01-12",
      readTime: "7 min read",
      category: "Study Tips",
      featured: true,
      image: "/placeholder.svg?height=300&width=600",
    },
    {
      id: "3",
      title: "How AI is Revolutionizing Personalized Education",
      excerpt:
        "Explore how artificial intelligence is creating customized learning experiences that adapt to each student's unique needs and learning style.",
      content: "",
      author: "Clara.ai Team",
      publishedAt: "2024-01-10",
      readTime: "6 min read",
      category: "AI & Education",
      featured: false,
      image: "/placeholder.svg?height=300&width=600",
    },
    {
      id: "4",
      title: "Building Better Study Habits: A Step-by-Step Guide",
      excerpt:
        "Learn how to create sustainable study routines that stick, with practical tips for time management and motivation.",
      content: "",
      author: "Dr. Emily Watson",
      publishedAt: "2024-01-08",
      readTime: "4 min read",
      category: "Study Tips",
      featured: false,
      image: "/placeholder.svg?height=300&width=600",
    },
    {
      id: "5",
      title: "The Psychology of Learning: Understanding How Your Brain Processes Information",
      excerpt:
        "Dive deep into cognitive science to understand how memory formation works and how you can optimize your learning process.",
      content: "",
      author: "Dr. James Liu",
      publishedAt: "2024-01-05",
      readTime: "8 min read",
      category: "Learning Science",
      featured: false,
      image: "/placeholder.svg?height=300&width=600",
    },
    {
      id: "6",
      title: "Voice Learning: The Future of Educational Technology",
      excerpt:
        "Discover how voice-based learning interfaces are making education more accessible and engaging for students worldwide.",
      content: "",
      author: "Clara.ai Team",
      publishedAt: "2024-01-03",
      readTime: "5 min read",
      category: "AI & Education",
      featured: false,
      image: "/placeholder.svg?height=300&width=600",
    },
  ]

  const featuredPosts = blogPosts.filter((post) => post.featured)
  const regularPosts = blogPosts.filter((post) => !post.featured)

  const categories = ["All", "Learning Science", "Study Tips", "AI & Education"]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-gray-900">
            Clara.ai
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/blog" className="text-gray-600 hover:text-gray-900">
              Blog
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <SignInButton mode="modal">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Sign in
              </Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">Get Started</Button>
            </SignInButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            The Clara.ai <span className="text-blue-600">Learning Blog</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover evidence-based learning strategies, AI insights, and study tips to supercharge your education.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-12">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "ghost"}
                size="sm"
                className={category === "All" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Posts */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 overflow-hidden">
                  <img src={post.image || "/placeholder.svg"} alt={post.title} className="w-full h-full object-cover" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    <Badge variant="outline">Featured</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{post.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Regular Posts */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 overflow-hidden">
                  <img src={post.image || "/placeholder.svg"} alt={post.title} className="w-full h-full object-cover" />
                </div>
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit mb-2">
                    {post.category}
                  </Badge>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{post.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-20">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated with Learning Insights</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Get the latest research-backed learning strategies, study tips, and Clara.ai updates delivered to your
                inbox weekly.
              </p>
              <div className="flex gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button className="bg-blue-600 hover:bg-blue-700">Subscribe</Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">No spam. Unsubscribe anytime.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 mt-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-xl font-semibold text-gray-900 mb-2">Clara.ai</div>
              <p className="text-gray-600">Supercharge your learning with AI</p>
            </div>

            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
              <div className="flex space-x-6">
                <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Blog
                </Link>
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-500">© 2024 Clara.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
