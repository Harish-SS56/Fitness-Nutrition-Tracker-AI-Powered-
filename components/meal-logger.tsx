"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, CheckCircle, AlertCircle, Database, Sparkles } from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import { AchievementNotification } from "@/components/achievement-notification"

export function MealLogger({ userId, onMealLogged }) {
  const [mealText, setMealText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [logging, setLogging] = useState(false)
  const [parsedMeal, setParsedMeal] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [newAchievements, setNewAchievements] = useState([])

  const handleParseMeal = async () => {
    if (!mealText.trim()) return

    setParsing(true)
    setError("")
    setParsedMeal(null)

    try {
      const response = await ApiClient.parseMeal(mealText)
      setParsedMeal(response)
    } catch (err) {
      setError(err.message || "Failed to parse meal")
    } finally {
      setParsing(false)
    }
  }

  const handleLogMeal = async () => {
    if (!parsedMeal) {
      console.log("[v0] handleLogMeal called but no parsedMeal available")
      return
    }

    console.log("[v0] Starting meal logging process...")
    console.log("[v0] Parsed meal data:", parsedMeal)
    console.log("[v0] User ID:", userId)

    setLogging(true)
    setError("")

    try {
      const mealData = {
        user_id: userId,
        meal_text: parsedMeal.original_text,
        calories: parsedMeal.totals.calories,
        protein: parsedMeal.totals.protein,
        fat: parsedMeal.totals.fat,
        carbs: parsedMeal.totals.carbs,
        fiber: parsedMeal.totals.fiber,
      }

      console.log("[v0] Sending meal data to API:", mealData)

      const response = await ApiClient.logMeal(mealData)

      console.log("[v0] API response:", response)

      // Check for new achievements
      if (response.new_achievements && response.new_achievements.length > 0) {
        setNewAchievements(response.new_achievements)
      }

      setSuccess(true)
      setMealText("")
      setParsedMeal(null)
      onMealLogged()

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("[v0] Error logging meal:", err)
      setError(err.message || "Failed to log meal")
    } finally {
      setLogging(false)
    }
  }

  const handleReset = () => {
    setMealText("")
    setParsedMeal(null)
    setError("")
    setSuccess(false)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Log Your Meal</CardTitle>
          <CardDescription>Describe what you ate and we'll calculate the nutrition automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              placeholder="e.g., I ate 200g grilled chicken breast with 150g brown rice and some broccoli"
              className="min-h-[100px] bg-input border-border"
              disabled={parsing || logging}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleParseMeal}
              disabled={!mealText.trim() || parsing || logging}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {parsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Analyze Meal
                </>
              )}
            </Button>

            {parsedMeal && (
              <Button
                onClick={handleLogMeal}
                disabled={logging}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                {logging ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Log Meal
                  </>
                )}
              </Button>
            )}

            {(parsedMeal || error) && (
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Meal logged successfully!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parsed Results */}
      {parsedMeal && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Nutrition Analysis</CardTitle>
            <CardDescription>Review the calculated nutrition values</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nutrition Totals */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{parsedMeal.totals.calories}</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{parsedMeal.totals.protein}g</div>
                <div className="text-xs text-muted-foreground">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{parsedMeal.totals.fat}g</div>
                <div className="text-xs text-muted-foreground">Fat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-4">{parsedMeal.totals.carbs}g</div>
                <div className="text-xs text-muted-foreground">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-5">{parsedMeal.totals.fiber}g</div>
                <div className="text-xs text-muted-foreground">Fiber</div>
              </div>
            </div>

            {/* Food Items */}
            <div>
              <h4 className="font-medium text-card-foreground mb-3">Detected Food Items:</h4>
              <div className="space-y-2">
                {parsedMeal.nutrition_results.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium text-card-foreground">{item.matched_food || item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.quantity_g}g</div>
                    </div>
                    <div className="text-right">
                      {item.nutrition ? (
                        <div className="text-sm space-y-1">
                          <div>
                            <Badge variant="secondary" className="mr-1">
                              {item.nutrition.calories} cal
                            </Badge>
                            <Badge variant="outline">{item.nutrition.protein}g protein</Badge>
                          </div>
                          <div className="flex justify-end">
                            {item.ai_calculated ? (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI Calculated
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Database className="w-3 h-3" />
                                Database
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="destructive">Not found</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Notification */}
      <AchievementNotification 
        achievements={newAchievements}
        onClose={() => setNewAchievements([])}
      />
    </div>
  )
}
