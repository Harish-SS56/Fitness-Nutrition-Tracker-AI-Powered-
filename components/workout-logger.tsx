"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, Clock, Flame, Plus, CheckCircle } from "lucide-react"

export function WorkoutLogger({ user, onWorkoutLogged }) {
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState("")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeCategory, setActiveCategory] = useState("cardio")

  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async () => {
    try {
      const response = await fetch("/api/workouts/exercises")
      const data = await response.json()
      if (data.success) {
        setExercises(data.exercises)
      }
    } catch (error) {
      console.error("Error loading exercises:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedExercise || !duration) return

    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch("/api/workouts/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: selectedExercise,
          duration_minutes: parseInt(duration),
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setSelectedExercise("")
        setDuration("")
        setNotes("")
        
        // Notify parent component
        if (onWorkoutLogged) {
          onWorkoutLogged(data.workout)
        }

        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        console.error("Failed to log workout:", data.error)
        alert(`Failed to log workout: ${data.error}`)
      }
    } catch (error) {
      console.error("Error logging workout:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error logging workout: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const getExercisesByCategory = (category) => {
    return exercises.filter(exercise => exercise.category === category)
  }

  const getSelectedExerciseDetails = () => {
    return exercises.find(ex => ex.exercise_id === parseInt(selectedExercise))
  }

  const calculateEstimatedCalories = () => {
    const exercise = getSelectedExerciseDetails()
    if (exercise && duration) {
      return Math.round(exercise.calories_per_minute * parseInt(duration))
    }
    return 0
  }

  const categories = [
    { id: "cardio", name: "Cardio", icon: "🏃‍♂️" },
    { id: "strength", name: "Strength", icon: "💪" },
    { id: "sports", name: "Sports", icon: "⚽" },
    { id: "flexibility", name: "Flexibility", icon: "🧘‍♀️" },
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-primary" />
          <CardTitle>Log Workout</CardTitle>
        </div>
        <CardDescription>
          Track your exercise and automatically deduct calories burned from your daily goal
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span>Workout logged successfully! Calories deducted from your daily goal.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exercise Category Tabs */}
          <div>
            <Label className="text-base font-medium">Exercise Category</Label>
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mt-2">
              <TabsList className="grid w-full grid-cols-4">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id} className="text-sm">
                    <span className="mr-1">{category.icon}</span>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="mt-4">
                  <div>
                    <Label htmlFor="exercise">Select Exercise</Label>
                    <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Choose a ${category.name.toLowerCase()} exercise`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getExercisesByCategory(category.id).map((exercise) => (
                          <SelectItem key={exercise.exercise_id} value={exercise.exercise_id.toString()}>
                            <div className="flex justify-between items-center w-full">
                              <span>{exercise.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {exercise.calories_per_minute} cal/min
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Duration Input */}
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                className="pl-10"
                min="1"
                max="300"
                required
              />
            </div>
          </div>

          {/* Estimated Calories */}
          {selectedExercise && duration && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <Flame className="w-5 h-5" />
                <span className="font-medium">
                  Estimated calories burned: {calculateEstimatedCalories()} calories
                </span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                This will be automatically deducted from your daily calorie goal
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did the workout feel? Any observations..."
              className="min-h-[80px]"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !selectedExercise || !duration}
          >
            <Plus className="w-4 h-4 mr-2" />
            {loading ? "Logging Workout..." : "Log Workout"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
