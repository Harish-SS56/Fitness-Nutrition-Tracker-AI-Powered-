"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Target, TrendingUp, AlertCircle } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { SignupFlow } from "@/components/auth/signup-flow"
import { Dashboard } from "@/components/dashboard"
import { ErrorBoundary } from "@/components/error-boundary"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [authMode, setAuthMode] = useState<"landing" | "login" | "signup">("landing")
  const [appError, setAppError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error: any) {
      console.error("Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (user: any) => {
    setCurrentUser(user)
  }

  const handleSignupComplete = () => {
    setAuthMode("login")
  }

  const handleLogout = async () => {
    try {
      // Try to call logout API, but don't fail if it doesn't work
      const response = await fetch("/api/auth/logout", { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.warn("Logout API failed, but continuing with client-side logout")
      }
    } catch (error) {
      console.warn("Logout API error (continuing anyway):", error)
    } finally {
      // Always clear user state regardless of API success/failure
      setCurrentUser(null)
      setAuthMode("landing")
      
      // Clear any local storage or session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        sessionStorage.clear()
      }
      
      console.log("User logged out successfully")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading fitness tracker...</p>
        </div>
      </div>
    )
  }

  if (appError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-card-foreground">App Initialization Failed</CardTitle>
            <CardDescription>There was an issue starting the application. Please check your setup.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">{appError}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentUser) {
    return (
      <ErrorBoundary>
        <Dashboard user={currentUser} onLogout={handleLogout} />
      </ErrorBoundary>
    )
  }

  // Show auth forms
  if (authMode === "signup") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <SignupFlow
          onSignupComplete={handleSignupComplete}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      </div>
    )
  }

  if (authMode === "login") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <LoginForm
          onLogin={handleLogin}
          onSwitchToSignup={() => setAuthMode("signup")}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">Track Your Fitness Journey</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Take control of your nutrition and fitness goals with our intelligent tracking system. Get personalized
            recommendations and track your progress effortlessly.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => setAuthMode("signup")}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
            >
              Get Started
            </Button>
            <Button
              onClick={() => setAuthMode("login")}
              variant="outline"
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-card-foreground">Smart Meal Logging</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Simply describe what you ate and our AI will automatically calculate nutrition values from our
                comprehensive food database.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="text-card-foreground">Personalized Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Set custom calorie and protein targets based on your BMI, goals, and lifestyle. Track your progress with
                visual indicators.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-card-foreground">AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Get intelligent suggestions for meals and foods to help you reach your daily nutrition goals and
                maintain a balanced diet.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-muted rounded-lg p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Transform Your Health?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of users who have already started their fitness journey with our app.
          </p>
          <Button
            onClick={() => setAuthMode("signup")}
            variant="default"
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Start Tracking Today
          </Button>
        </div>
      </div>
    </div>
  )
}
