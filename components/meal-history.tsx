"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, Utensils, TrendingUp, Database, Sparkles, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function MealHistory({ userId }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [meals, setMeals] = useState([])
  const [dailyTotals, setDailyTotals] = useState(null)
  const [workoutData, setWorkoutData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadMealsForDate(selectedDate)
  }, [selectedDate, userId])

  const loadMealsForDate = async (date) => {
    setLoading(true)
    setError("")
    
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // Load both meals and workout data
      const [mealsResponse, workoutsResponse] = await Promise.all([
        fetch(`/api/meals?user_id=${userId}&date=${dateStr}`),
        fetch(`/api/workouts/daily?date=${dateStr}`)
      ])
      
      const mealsData = await mealsResponse.json()
      const workoutsData = await workoutsResponse.json()
      
      if (mealsData.success) {
        // Ensure meals is always an array to prevent undefined errors
        setMeals(Array.isArray(mealsData.meals) ? mealsData.meals : [])
        
        // Calculate net calories if we have workout data
        const totals = mealsData.totals || {}
        const caloriesBurned = workoutsData.success ? (workoutsData.totalCaloriesBurned || 0) : 0
        const netCalories = (totals.total_calories || 0) - caloriesBurned
        
        setDailyTotals({
          ...totals,
          calories_burned: caloriesBurned,
          net_calories: netCalories
        })
        
        setWorkoutData(workoutsData.success ? workoutsData : null)
      } else {
        setError(mealsData.error || "Failed to load meals")
        // Set empty array on error to prevent undefined
        setMeals([])
        setDailyTotals(null)
        setWorkoutData(null)
      }
    } catch (err) {
      console.error("Error loading meals:", err)
      setError("Failed to load meal history")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMeal = async (mealId) => {
    if (!confirm("Are you sure you want to delete this meal?")) return

    try {
      const response = await fetch(`/api/meals/delete/${mealId}`, {
        method: "DELETE"
      })
      
      const data = await response.json()
      if (data.success) {
        // Update meals state immediately to prevent undefined errors
        setMeals(prevMeals => (prevMeals || []).filter(meal => meal.meal_id !== mealId))
        // Also reload to get updated totals
        loadMealsForDate(selectedDate)
      } else {
        setError(data.error || "Failed to delete meal")
      }
    } catch (err) {
      console.error("Error deleting meal:", err)
      setError("Failed to delete meal")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Utensils className="w-5 h-5 text-primary" />
            Meal History
          </CardTitle>
          <CardDescription>
            View your meal logs and nutrition tracking over time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select Date:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Summary */}
      {dailyTotals && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Daily Summary - {format(selectedDate, "MMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {dailyTotals.net_calories?.toFixed(0) || 0}
                </div>
                <div className="text-xs text-muted-foreground">Net Calories</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {dailyTotals.total_calories?.toFixed(0) || 0} - {dailyTotals.calories_burned?.toFixed(0) || 0}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-secondary">
                  {dailyTotals.total_protein?.toFixed(1) || 0}g
                </div>
                <div className="text-xs text-muted-foreground">Protein</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-accent">
                  {dailyTotals.total_fat?.toFixed(1) || 0}g
                </div>
                <div className="text-xs text-muted-foreground">Fat</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-chart-4">
                  {dailyTotals.total_carbs?.toFixed(1) || 0}g
                </div>
                <div className="text-xs text-muted-foreground">Carbs</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-chart-5">
                  {dailyTotals.total_fiber?.toFixed(1) || 0}g
                </div>
                <div className="text-xs text-muted-foreground">Fiber</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meals List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Logged Meals</CardTitle>
          <CardDescription>
            {meals.length > 0 
              ? `${meals.length} meal${meals.length > 1 ? 's' : ''} logged on ${format(selectedDate, "MMM dd, yyyy")}`
              : `No meals logged on ${format(selectedDate, "MMM dd, yyyy")}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading meals...</p>
            </div>
          ) : meals.length > 0 ? (
            <div className="space-y-4">
              {meals.map((meal, index) => (
                <div key={meal.meal_id || index} className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-card-foreground">{meal.meal_text}</h4>
                      <p className="text-sm text-muted-foreground">
                        {meal.meal_time ? 
                          new Date(`${meal.meal_date}T${meal.meal_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) :
                          new Date(meal.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        }
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMeal(meal.meal_id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Delete
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                    <div>
                      <div className="text-lg font-semibold text-primary">
                        {meal.calories?.toFixed(0) || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Calories</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-secondary">
                        {meal.protein?.toFixed(1) || 0}g
                      </div>
                      <div className="text-xs text-muted-foreground">Protein</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-accent">
                        {meal.fat?.toFixed(1) || 0}g
                      </div>
                      <div className="text-xs text-muted-foreground">Fat</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-chart-4">
                        {meal.carbs?.toFixed(1) || 0}g
                      </div>
                      <div className="text-xs text-muted-foreground">Carbs</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-chart-5">
                        {meal.fiber?.toFixed(1) || 0}g
                      </div>
                      <div className="text-xs text-muted-foreground">Fiber</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No meals logged for this date</p>
              <p className="text-sm text-muted-foreground">
                Start logging your meals to track your nutrition progress!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
