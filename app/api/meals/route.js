import { NextResponse } from "next/server"
import { logMeal, getMeals } from "../../../lib/database.js"
import { AchievementService } from "../../../lib/achievement-service.js"

export async function POST(request) {
  try {
    const { user_id, meal_text, calories, protein, fat, carbs, fiber } = await request.json()

    // Validate required fields
    if (!user_id || !meal_text) {
      return NextResponse.json({ error: "User ID and meal text are required" }, { status: 400 })
    }

    // Log the meal
    const meal = await logMeal({
      user_id,
      meal_text,
      calories: calories || 0,
      protein: protein || 0,
      fat: fat || 0,
      carbs: carbs || 0,
      fiber: fiber || 0,
    })

    console.log("[v0] Meals API POST successful, returning:", { success: true, meal })

    // CRITICAL: Auto-trigger achievement updates after meal logging
    try {
      console.log("[Meals] Triggering achievement updates for user:", user_id)
      await AchievementService.checkMealAchievements(user_id)
      console.log("[Meals] Achievement updates completed successfully")
    } catch (achievementError) {
      console.error("[Meals] Achievement update failed:", achievementError)
      // Don't fail the meal logging if achievements fail
    }
    
    return NextResponse.json({
      success: true,
      meal,
      message: "Meal logged successfully. Use 'Sync Achievements' button to update progress."
    })
  } catch (error) {
    console.error("[v0] Error logging meal:", error)
    return NextResponse.json({ error: "Failed to log meal" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = Number.parseInt(searchParams.get("user_id"))
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: "Valid user ID is required" }, { status: 400 })
    }

    console.log("[v0] Meals API GET - fetching meals for user:", userId, "date:", date)

    const meals = await getMeals(userId, date)
    
    // Calculate daily totals
    const totals = meals.reduce((acc, meal) => ({
      total_calories: acc.total_calories + (meal.calories || 0),
      total_protein: acc.total_protein + (meal.protein || 0),
      total_fat: acc.total_fat + (meal.fat || 0),
      total_carbs: acc.total_carbs + (meal.carbs || 0),
      total_fiber: acc.total_fiber + (meal.fiber || 0)
    }), {
      total_calories: 0,
      total_protein: 0,
      total_fat: 0,
      total_carbs: 0,
      total_fiber: 0
    })

    return NextResponse.json({
      success: true,
      meals,
      totals
    })

  } catch (error) {
    console.error("[v0] Error fetching meals:", error)
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 })
  }
}
