"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Target, TrendingUp, Utensils, Sparkles, AlertCircle, LogOut, Dumbbell, Database, Trophy, Settings } from "lucide-react"
import Link from "next/link"
import { MealLogger } from "@/components/meal-logger"
import { AiChat } from "@/components/ai-chat"
import { ProfileModal } from "@/components/profile/profile-modal"
import { WorkoutLogger } from "@/components/workout-logger"
import { MealHistory } from "@/components/meal-history"
import { EmailSettings } from "@/components/email-settings"
import { ApiClient } from "@/lib/api-client"

export function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [progress, setProgress] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(user)

  useEffect(() => {
    console.log("[v0] Dashboard loading for user:", user?.user_id)
    loadProgress()
    loadRecommendations()
    loadWorkouts()
  }, [user.user_id])

  const loadProgress = async () => {
    try {
      console.log("[v0] Loading progress...")
      const today = new Date().toISOString().split("T")[0]
      const response = await ApiClient.getProgress(user.user_id, today)
      console.log("[v0] Progress loaded:", response)
      setProgress(response.progress)
      setError(null)
    } catch (error) {
      console.error("[v0] Failed to load progress:", error)
      setError("Failed to load progress data")
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendations = async () => {
    try {
      console.log("[v0] Loading recommendations...")
      const today = new Date().toISOString().split("T")[0]
      const response = await ApiClient.getRecommendations(user.user_id, today)
      console.log("[v0] Recommendations loaded:", response)
      setRecommendations(response.recommendations)
    } catch (error) {
      console.error("[v0] Failed to load recommendations:", error)
      // Don't set error for recommendations as they're not critical
    }
  }

  const loadWorkouts = async () => {
    try {
      console.log("[v0] Loading workouts...")
      const today = new Date().toISOString().split("T")[0]
      const response = await fetch(`/api/workouts/daily?date=${today}`)
      const data = await response.json()
      if (data.success) {
        setWorkouts(data.workouts)
        setTotalCaloriesBurned(data.totalCaloriesBurned)
        console.log("[v0] Workouts loaded:", data)
      }
    } catch (error) {
      console.error("[v0] Failed to load workouts:", error)
    }
  }

  const generateNewRecommendations = async () => {
    setGeneratingRecommendations(true)
    try {
      console.log("[v0] Generating new recommendations...")
      const response = await ApiClient.generateRecommendations(user.user_id)
      setRecommendations(response.recommendations)
    } catch (error) {
      console.error("[v0] Failed to generate recommendations:", error)
    } finally {
      setGeneratingRecommendations(false)
    }
  }

  const handleMealLogged = async () => {
    console.log("[v0] Meal logged, refreshing progress and achievements...")
    
    // Refresh progress to show updated data
    loadProgress()
    
    // CRITICAL: Trigger achievement refresh in achievements page
    // This ensures achievements update immediately after meal logging
    try {
      // Send a custom event to refresh achievements if the achievements page is open
      window.dispatchEvent(new CustomEvent('refreshAchievements', { 
        detail: { userId: user.user_id } 
      }))
      console.log("[v0] Achievement refresh event dispatched")
    } catch (error) {
      console.log("[v0] Achievement refresh event not needed (achievements page not open)")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-card-foreground">Dashboard Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => {
                setError(null)
                setLoading(true)
                loadProgress()
                loadRecommendations()
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleProfileUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser)
  }

  const handleWorkoutLogged = (workout: any) => {
    console.log("[v0] Workout logged, refreshing progress and achievements...")
    
    // Reload workouts and progress when a new workout is logged
    loadWorkouts()
    loadProgress()
    
    // CRITICAL: Trigger achievement refresh for workout achievements
    try {
      // Send a custom event to refresh achievements if the achievements page is open
      window.dispatchEvent(new CustomEvent('refreshAchievements', { 
        detail: { userId: user.user_id } 
      }))
      console.log("[v0] Achievement refresh event dispatched for workout")
    } catch (error) {
      console.log("[v0] Achievement refresh event not needed (achievements page not open)")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {currentUser.name}!</h1>
            <p className="text-muted-foreground">Track your nutrition and reach your {currentUser.goal_type} goals</p>
          </div>
          <div className="flex gap-2">
            <ProfileModal user={currentUser} onUpdate={handleProfileUpdate} />
            <Button variant="outline" size="sm" onClick={onLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-muted">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">
              Overview
            </TabsTrigger>
            <TabsTrigger value="log-meal" className="data-[state=active]:bg-background">
              Log Meal
            </TabsTrigger>
            <TabsTrigger value="log-workout" className="data-[state=active]:bg-background">
              <Dumbbell className="w-4 h-4 mr-1" />
              Workout
            </TabsTrigger>
            <TabsTrigger value="ai-chat" className="data-[state=active]:bg-background">
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-background">
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-background">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Progress Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Net Calories Progress (Consumed - Burned) */}
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Net Daily Calories</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {progress?.calories?.net?.toFixed(0) || 0}
                    <span className="text-sm text-muted-foreground font-normal">/ {progress?.calories?.goal || 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Consumed:</span>
                      <span className="text-green-600">+{progress?.calories?.consumed?.toFixed(0) || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Burned:</span>
                      <span className="text-red-600">-{progress?.calories?.burned?.toFixed(0) || 0}</span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min((progress?.calories?.net || 0) / (progress?.calories?.goal || 1) * 100, 100)} 
                    className="mb-2" 
                  />
                  <p className="text-xs text-muted-foreground">
                    {(progress?.calories?.remaining || 0) > 0
                      ? `${progress?.calories?.remaining?.toFixed(0)} net calories remaining`
                      : "Net goal reached!"}
                  </p>
                </CardContent>
              </Card>

              {/* Protein Progress */}
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Daily Protein</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary mb-2">
                    {progress?.protein.consumed.toFixed(1) || 0}g
                    <span className="text-sm text-muted-foreground font-normal">/ {progress?.protein.goal || 0}g</span>
                  </div>
                  <Progress value={progress?.protein.percentage || 0} className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {progress?.protein.remaining > 0
                      ? `${progress.protein.remaining.toFixed(1)}g protein remaining`
                      : "Goal reached!"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
                <CardDescription>Log your meals and manage your nutrition database</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button
                  onClick={() => setActiveTab("log-meal")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Log a Meal
                </Button>
                <Link href="/nutrition">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Nutrition Database
                  </Button>
                </Link>
                <Link href="/achievements">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Achievements
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Today's Summary */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{progress?.calories?.net?.toFixed(0) || 0}</div>
                    <div className="text-xs text-muted-foreground">Net Calories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      {progress?.protein.consumed.toFixed(1) || 0}g
                    </div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">{progress?.fat?.toFixed(1) || 0}g</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-chart-4">{progress?.carbs?.toFixed(1) || 0}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Recommendations
                  </CardTitle>
                  <CardDescription>Personalized suggestions to help you reach your goals</CardDescription>
                </div>
                <Button
                  onClick={generateNewRecommendations}
                  disabled={generatingRecommendations}
                  variant="outline"
                  size="sm"
                >
                  {generatingRecommendations ? "Generating..." : "Refresh"}
                </Button>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div key={rec.recommendation_id || index} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-card-foreground">{rec.recommendation_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">No recommendations yet</p>
                    <Button
                      onClick={generateNewRecommendations}
                      disabled={generatingRecommendations}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Generate AI Recommendations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log-meal">
            <MealLogger userId={user.user_id} onMealLogged={handleMealLogged} />
          </TabsContent>

          <TabsContent value="log-workout">
            <WorkoutLogger user={currentUser} onWorkoutLogged={handleWorkoutLogged} />
          </TabsContent>

          <TabsContent value="ai-chat">
            <AiChat userId={user.user_id} />
          </TabsContent>

          <TabsContent value="history">
            <MealHistory userId={user.user_id} />
          </TabsContent>

          <TabsContent value="settings">
            <EmailSettings userId={user.user_id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
