"use client"

import { useState, useEffect } from "react"
import { Achievements } from "@/components/achievements"

export default function AchievementsPage() {
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication status using the same method as the main app
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          console.log("[AchievementsPage] Found logged-in user:", data.user.name, "ID:", data.user.user_id)
          setUserId(data.user.user_id)
        } else {
          console.log("[AchievementsPage] User not authenticated")
        }
      } catch (error) {
        console.error("[AchievementsPage] Auth check failed:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your achievements...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Please Log In</h1>
          <p className="text-muted-foreground">You need to be logged in to view achievements.</p>
        </div>
      </div>
    )
  }

  return <Achievements userId={userId} />
}
