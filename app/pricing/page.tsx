"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import Link from "next/link"
import { SignInButton } from "@clerk/nextjs"

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with AI-powered learning",
      features: [
        "5 study sessions per month",
        "Basic homework help",
        "2 class folders",
        "Text-based chat support",
        "Learning streak tracking",
      ],
      limitations: [
        "No voice sessions",
        "Limited file uploads (10MB total)",
        "Basic AI responses",
        "No priority support",
      ],
      buttonText: "Get Started Free",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Pro",
      price: "$12",
      originalPrice: "$15",
      period: "per month",
      description: "Unlock the full power of Clara.ai for serious learners",
      features: [
        "Unlimited study sessions",
        "Advanced homework help with step-by-step solutions",
        "Unlimited class folders",
        "Voice chat sessions with Clara",
        "Advanced learning analytics",
        "File upload up to 1GB per class",
        "Priority support",
        "Custom study schedules",
        "Progress reports",
        "Exam preparation mode",
      ],
      limitations: [],
      buttonText: "Start Pro Trial",
      buttonVariant: "default" as const,
      popular: true,
      eduDiscount: "20% off with .edu email",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "Designed for schools, universities, and educational institutions",
      features: [
        "Everything in Pro",
        "Unlimited users",
        "Admin dashboard",
        "Custom integrations",
        "LMS integration (Canvas, Blackboard, etc.)",
        "Advanced analytics & reporting",
        "Custom AI training on curriculum",
        "24/7 dedicated support",
        "Single sign-on (SSO)",
        "FERPA compliance",
        "Custom branding",
      ],
      limitations: [],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      popular: false,
    },
  ]

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
            Choose Your Learning <span className="text-blue-600">Journey</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From free basic features to enterprise solutions, Clara.ai grows with your learning needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular ? "border-blue-500 border-2 shadow-lg scale-105" : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    {plan.originalPrice && (
                      <span className="text-lg text-gray-400 line-through">{plan.originalPrice}</span>
                    )}
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  </div>
                  <p className="text-gray-600 mt-1">{plan.period}</p>
                  {plan.eduDiscount && <p className="text-sm text-green-600 font-medium mt-2">{plan.eduDiscount}</p>}
                </div>
                <p className="text-gray-600 mt-4">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Limitations:</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, limitationIndex) => (
                        <li key={limitationIndex} className="flex items-start gap-2">
                          <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <div className="pt-4">
                  {plan.name === "Enterprise" ? (
                    <Button variant={plan.buttonVariant} className="w-full" size="lg">
                      {plan.buttonText}
                    </Button>
                  ) : (
                    <SignInButton mode="modal">
                      <Button
                        variant={plan.buttonVariant}
                        className={`w-full ${plan.popular ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                        size="lg"
                      >
                        {plan.buttonText}
                      </Button>
                    </SignInButton>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How does the .edu email discount work?</h3>
              <p className="text-gray-600">
                Students and educators with valid .edu email addresses automatically receive 20% off the Pro plan.
                Simply sign up with your .edu email to apply the discount.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I switch plans anytime?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll
                prorate any billing adjustments.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a free trial for Pro?</h3>
              <p className="text-gray-600">
                Yes, we offer a 7-day free trial of Clara.ai Pro. No credit card required to start your trial.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and for Enterprise customers, we can arrange invoicing and
                purchase orders.
              </p>
            </div>
          </div>
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
