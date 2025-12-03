import { NextResponse } from "next/server"
import { getDailyTotals, getUserById, getRecommendations, getTotalCaloriesBurned } from "../../../lib/database.js"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = Number.parseInt(searchParams.get("user_id"))
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: "Valid user ID is required" }, { status: 400 })
    }

    // Get user goals
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get daily totals (food consumed)
    const totals = await getDailyTotals(userId, date)
    
    // Get daily workout calories burned
    const caloriesBurned = await getTotalCaloriesBurned(userId, date)
    
    // Calculate NET calories (consumed - burned)
    const netCalories = totals.total_calories - caloriesBurned
    
    console.log(`[Progress] User ${userId} on ${date}:`)
    console.log(`[Progress] Calories consumed: ${totals.total_calories}`)
    console.log(`[Progress] Calories burned: ${caloriesBurned}`)
    console.log(`[Progress] Net calories: ${netCalories}`)

    // Calculate progress percentages based on NET calories
    const calorieProgress = user.calorie_goal > 0 ? (netCalories / user.calorie_goal) * 100 : 0
    const proteinProgress = user.protein_goal > 0 ? (totals.total_protein / user.protein_goal) * 100 : 0

    // Calculate remaining goals based on NET calories
    const remainingCalories = Math.max(0, user.calorie_goal - netCalories)
    const remainingProtein = Math.max(0, user.protein_goal - totals.total_protein)

    // Get recommendations
    const recommendations = await getRecommendations(userId, date)

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        calorie_goal: user.calorie_goal,
        protein_goal: user.protein_goal,
        goal_type: user.goal_type,
      },
      progress: {
        calories: {
          consumed: totals.total_calories,
          burned: caloriesBurned,
          net: netCalories,
          goal: user.calorie_goal,
          remaining: remainingCalories,
          percentage: Math.min(100, calorieProgress),
        },
        protein: {
          consumed: totals.total_protein,
          goal: user.protein_goal,
          remaining: remainingProtein,
          percentage: Math.min(100, proteinProgress),
        },
        fat: totals.total_fat,
        carbs: totals.total_carbs,
        fiber: totals.total_fiber,
      },
      recommendations,
      date,
    })
  } catch (error) {
    console.error("Error fetching progress:", error)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}
