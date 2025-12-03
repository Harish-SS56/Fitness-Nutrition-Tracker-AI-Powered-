import { NextResponse } from "next/server"
import { getSessionUser, logWorkout, getExerciseById } from "../../../../lib/database.js"
import { AchievementService } from "../../../../lib/achievement-service.js"

export async function POST(request) {
  try {
    const sessionId = request.cookies.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const currentUser = await getSessionUser(sessionId)
    if (!currentUser) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const { exercise_id, duration_minutes, notes } = await request.json()

    console.log("[v0] Workout log request:", { exercise_id, duration_minutes, notes })

    // Validate required fields
    if (!exercise_id || !duration_minutes) {
      return NextResponse.json({ error: "Exercise and duration are required" }, { status: 400 })
    }

    // Get exercise details to calculate calories
    const exercise = await getExerciseById(parseInt(exercise_id))

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }

    // Calculate calories burned based on duration and exercise
    const calories_burned = Math.round(exercise.calories_per_minute * duration_minutes)

    // Log workout in database
    const workoutData = {
      user_id: currentUser.user_id,
      exercise_id: parseInt(exercise_id),
      duration_minutes: parseInt(duration_minutes),
      calories_burned,
      notes: notes || null,
    }

    const workout = await logWorkout(workoutData)

    // CRITICAL: Auto-trigger achievement updates after workout logging
    try {
      console.log("[Workouts] Triggering achievement updates for user:", currentUser.user_id)
      await AchievementService.checkMealAchievements(currentUser.user_id)
      console.log("[Workouts] Achievement updates completed successfully")
    } catch (achievementError) {
      console.error("[Workouts] Achievement update failed:", achievementError)
      // Don't fail the workout logging if achievements fail
    }

    return NextResponse.json({
      success: true,
      workout: {
        ...workout,
        exercise_name: exercise.name,
        category: exercise.category,
      },
    })
  } catch (error) {
    console.error("[v0] Error logging workout:", error)
    return NextResponse.json({ error: "Failed to log workout: " + error.message }, { status: 500 })
  }
}
