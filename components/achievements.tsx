"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Trophy, Target, Calendar, Crown, Flame, Star, Gem, Dumbbell, Calculator, Award, Zap, Medal, Sparkles, ArrowLeft, RefreshCw
} from "lucide-react"
import Link from "next/link"

const ICON_MAP = {
  Trophy: Trophy,
  Award: Award,
  Medal: Medal,
  Star: Star,
  Target: Target,
  Zap: Zap,
  Calendar: Calendar,
  Crown: Crown,
  Flame: Flame,
  Sparkles: Sparkles,
  Gem: Gem,
  Dumbbell: Dumbbell,
  Calculator: Calculator
}

interface Achievement {
  achievement_id: number
  name: string
  description: string
  badge_icon: string
  badge_color: string
  category: string
  is_earned: boolean
  current_progress: number
  target_value: number
  target_unit: string
  earned_at?: string
  progress_percentage?: number
}

interface AchievementStats {
  earned_achievements: number
  nutrition_badges: number
  consistency_badges: number
  milestone_badges: number
  total_achievements: number
}

export function Achievements({ userId }: { userId: number }) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<AchievementStats>({
    earned_achievements: 0,
    nutrition_badges: 0,
    consistency_badges: 0,
    milestone_badges: 0,
    total_achievements: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [showNewAchievement, setShowNewAchievement] = useState(false)
  const [autoSyncStatus, setAutoSyncStatus] = useState<string>("")

  const loadAchievements = useCallback(async () => {
    if (!userId) {
      console.log("[Achievements] No userId provided, setting loading to false")
      setLoading(false)
      return
    }
    
    console.log("[Achievements] Starting to load achievements for user:", userId)
    setLoading(true)
    
    try {
      // Simple fetch without any sync to prevent repeated loading
      const response = await fetch(`/api/achievements?user_id=${userId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("[Achievements] API response:", data)
      
      if (data.success) {
        setAchievements(data.achievements || [])
        setRecentAchievements(data.recent_achievements || [])
        setStats(data.stats || {
          earned_achievements: 0,
          nutrition_badges: 0,
          consistency_badges: 0,
          milestone_badges: 0,
          total_achievements: 0
        })
        console.log(`[Achievements] Successfully loaded ${data.achievements?.length || 0} achievements`)
      } else {
        console.error("[Achievements] API returned error:", data.error)
        // Still set loading to false even if API returns error
      }
    } catch (error) {
      console.error("[Achievements] Failed to load achievements:", error)
      // Set empty data to prevent infinite loading
      setAchievements([])
      setRecentAchievements([])
      setStats({
        earned_achievements: 0,
        nutrition_badges: 0,
        consistency_badges: 0,
        milestone_badges: 0,
        total_achievements: 0
      })
    } finally {
      console.log("[Achievements] Setting loading to false")
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadAchievements()
    } else {
      // If no userId, stop loading
      setLoading(false)
    }
    
    // CRITICAL: Listen for achievement refresh events from meal logging
    const handleRefreshEvent = (event: any) => {
      console.log("[Achievements] Received refresh event:", event.detail)
      if (event.detail?.userId === userId) {
        console.log("[Achievements] Refreshing achievements due to meal logging")
        loadAchievements()
      }
    }
    
    window.addEventListener('refreshAchievements', handleRefreshEvent)
    
    // Auto-refresh achievements every 30 seconds (reduced frequency since we have event-based updates)
    const timeout = setTimeout(() => {
      if (userId) {
        loadAchievements()
      }
    }, 30000) // 30 seconds
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('refreshAchievements', handleRefreshEvent)
    }
  }, [userId, loadAchievements])

  const forceSync = async () => {
    try {
      console.log("🔄 Force syncing achievements...")
      setAutoSyncStatus("Syncing...")
      
      const response = await fetch('/api/achievements/force-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      
      const result = await response.json()
      console.log("Force sync result:", result)
      
      // Reload achievements after force sync
      await loadAchievements()
      
      if (result.newly_earned && result.newly_earned.length > 0) {
        setNewAchievements(result.newly_earned)
        setShowNewAchievement(true)
      }
    } catch (error) {
      console.error("Force sync failed:", error)
    }
  }

  const filteredAchievements = achievements.filter((achievement: Achievement) => 
    selectedCategory === "all" || achievement.category === selectedCategory
  )

  // Fix logical categorization - achievements should be in only ONE category
  const earnedAchievements = achievements.filter((a: Achievement) => a.is_earned === true)
  const inProgressAchievements = achievements.filter((a: Achievement) => 
    a.is_earned === false && (a.progress_percentage || 0) > 0
  )
  const lockedAchievements = achievements.filter((a: Achievement) => 
    a.is_earned === false && (a.progress_percentage || 0) === 0
  )

  const getIconComponent = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || Trophy
    return IconComponent
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      nutrition: "bg-green-500",
      consistency: "bg-blue-500", 
      milestone: "bg-purple-500",
      fitness: "bg-orange-500"
    }
    return colors[category] || "bg-gray-500"
  }

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const IconComponent = getIconComponent(achievement.badge_icon)
    // Use the progress_percentage from the API instead of calculating it
    const progressPercentage = achievement.progress_percentage || 0
    
    return (
      <Card className="bg-card border-border hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div 
              className={`p-3 rounded-full ${achievement.is_earned ? 'bg-yellow-100' : 'bg-muted'}`}
              style={{ 
                backgroundColor: achievement.is_earned ? achievement.badge_color + '20' : undefined,
                borderColor: achievement.badge_color 
              }}
            >
              <IconComponent 
                className="w-6 h-6" 
                style={{ color: achievement.badge_color }}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground truncate">{achievement.name}</h3>
                {achievement.is_earned && achievement.earned_at && (
                  <Badge variant="secondary" className="text-xs">
                    Earned {new Date(achievement.earned_at).toLocaleDateString()}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
              
              {/* Show progress ONLY for non-earned achievements */}
              {!achievement.is_earned && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.min(progressPercentage, 99).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(progressPercentage, 99)} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {achievement.name.includes('Daily') ? 
                      `${Math.min(progressPercentage, 99).toFixed(1)}% of daily goal` :
                      `${achievement.current_progress?.toFixed(1) || 0} / ${achievement.target_value} ${achievement.target_unit}`
                    }
                  </div>
                </div>
              )}
              
              {/* Show completion message for earned achievements */}
              {achievement.is_earned && (
                <div className="text-sm text-green-600 font-medium">
                  ✅ Completed! Goal achieved.
                </div>
              )}
              
              <Badge 
                variant="outline" 
                className={`mt-3 text-xs ${getCategoryColor(achievement.category)} text-white border-0`}
              >
                {achievement.category}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
            <p className="text-muted-foreground mt-1">Track your fitness milestones and earn badges</p>
            {autoSyncStatus && (
              <p className="text-sm text-primary mt-2">{autoSyncStatus}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                try {
                  console.log("🔧 Updating achievements...")
                  setLoading(true)
                  
                  const response = await fetch('/api/achievements/direct-fix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId })
                  })
                  const result = await response.json()
                  console.log("Update result:", result)
                  
                  if (result.success) {
                    // Force reload achievements with the correct user ID
                    const actualUserId = result.actual_user_id || userId
                    
                    // Fetch fresh achievements data
                    const achievementsResponse = await fetch(`/api/achievements?user_id=${actualUserId}`)
                    const achievementsData = await achievementsResponse.json()
                    
                    if (achievementsData.success) {
                      setAchievements(achievementsData.achievements || [])
                      setRecentAchievements(achievementsData.recent_achievements || [])
                      setStats(achievementsData.stats || {
                        earned_achievements: 0,
                        nutrition_badges: 0,
                        consistency_badges: 0,
                        milestone_badges: 0,
                        total_achievements: 0
                      })
                    }
                    
                    const workingCount = result.results.filter((r: any) => parseFloat(r.percentage) > 0).length
                    alert(`✅ Achievements updated!\n\n${workingCount}/${result.results.length} achievements showing progress`)
                  } else {
                    alert(`❌ Update failed: ${result.error}`)
                  }
                } catch (error: any) {
                  console.error("Update failed:", error)
                  alert(`❌ Update failed: ${error.message}`)
                } finally {
                  setLoading(false)
                }
              }}
              variant="default"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Update Progress
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card key="earned-stats">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{stats.earned_achievements}</div>
              <div className="text-sm text-muted-foreground">Earned</div>
            </CardContent>
          </Card>
          
          <Card key="nutrition-stats">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{stats.nutrition_badges}</div>
              <div className="text-sm text-muted-foreground">Nutrition</div>
            </CardContent>
          </Card>
          
          <Card key="consistency-stats">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{stats.consistency_badges}</div>
              <div className="text-sm text-muted-foreground">Consistency</div>
            </CardContent>
          </Card>
          
          <Card key="milestone-stats">
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{stats.milestone_badges}</div>
              <div className="text-sm text-muted-foreground">Milestones</div>
            </CardContent>
          </Card>
          
          <Card key="total-stats">
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{stats.total_achievements}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Recent Achievements
              </CardTitle>
              <CardDescription>Your latest earned badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {recentAchievements.map((achievement: Achievement, index: number) => {
                  const IconComponent = getIconComponent(achievement.badge_icon)
                  return (
                    <div key={`recent-${achievement.achievement_id}-${index}`} className="flex-shrink-0 text-center">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto"
                        style={{ backgroundColor: achievement.badge_color + '20' }}
                      >
                        <IconComponent 
                          className="w-8 h-8" 
                          style={{ color: achievement.badge_color }}
                        />
                      </div>
                      <p className="text-sm font-medium text-foreground max-w-20 truncate">{achievement.name}</p>
                      {achievement.earned_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievement Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger key="all" value="all">All</TabsTrigger>
            <TabsTrigger key="nutrition" value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger key="consistency" value="consistency">Consistency</TabsTrigger>
            <TabsTrigger key="milestone" value="milestone">Milestones</TabsTrigger>
            <TabsTrigger key="fitness" value="fitness">Fitness</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-6">
            {/* Earned Achievements */}
            {earnedAchievements.filter((a: Achievement) => selectedCategory === "all" || a.category === selectedCategory).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Earned ({earnedAchievements.filter((a: Achievement) => selectedCategory === "all" || a.category === selectedCategory).length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earnedAchievements
                    .filter((a: Achievement) => selectedCategory === "all" || a.category === selectedCategory)
                    .map((achievement: Achievement) => (
                      <AchievementCard key={achievement.achievement_id} achievement={achievement} />
                    ))}
                </div>
              </div>
            )}

            {/* In Progress Achievements */}
            {inProgressAchievements.filter((a: Achievement) => selectedCategory === "all" || a.category === selectedCategory).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  In Progress ({inProgressAchievements.filter((a: Achievement) => selectedCategory === "all" || a.category === selectedCategory).length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgressAchievements
                    .filter((a: Achievement) => selectedCategory === "all" || a.category === selectedCategory)
                    .map((achievement: Achievement) => (
                      <AchievementCard key={achievement.achievement_id} achievement={achievement} />
                    ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.filter((a: Achievement) => selectedCategory === "all" || a.category === selectedCategory).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-gray-400" />
                  Locked ({lockedAchievements.filter((a: Achievement) => selectedCategory === "all" || a.category === selectedCategory).length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lockedAchievements
                    .filter((a: Achievement) => selectedCategory === "all" || a.category === selectedCategory)
                    .map((achievement: Achievement) => (
                      <AchievementCard key={achievement.achievement_id} achievement={achievement} />
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* New Achievement Dialog */}
        <Dialog open={showNewAchievement} onOpenChange={setShowNewAchievement}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">🎉 Achievement Unlocked!</DialogTitle>
              <DialogDescription className="text-center">
                Congratulations on earning a new badge!
              </DialogDescription>
            </DialogHeader>
            {newAchievements.length > 0 && (
              <div className="text-center py-4">
                {newAchievements.map((achievement: Achievement) => {
                  const IconComponent = getIconComponent(achievement.badge_icon)
                  return (
                    <div key={achievement.achievement_id} className="mb-4">
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: achievement.badge_color + '20' }}
                      >
                        <IconComponent 
                          className="w-10 h-10" 
                          style={{ color: achievement.badge_color }}
                        />
                      </div>
                      <h3 className="font-semibold text-lg text-foreground">{achievement.name}</h3>
                      <p className="text-muted-foreground">{achievement.description}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
