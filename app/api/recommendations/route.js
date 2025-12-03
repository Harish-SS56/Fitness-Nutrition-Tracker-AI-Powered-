import { NextResponse } from "next/server"
import { saveRecommendation, getRecommendations, getUserById, getDailyTotals } from "../../../lib/database.js"
import { GeminiClient } from "../../../lib/gemini-client.js"
import { getTopFoodsByNutrient } from "../../../lib/nutrition-search.js"

// Simple recommendation generator (will be enhanced with AI)
async function generateRecommendations(user, dailyTotals) {
  const recommendations = []

  const remainingCalories = Math.max(0, user.calorie_goal - dailyTotals.total_calories)
  const remainingProtein = Math.max(0, user.protein_goal - dailyTotals.total_protein)

  if (remainingCalories > 200) {
    if (remainingProtein > 10) {
      recommendations.push(
        `You need ${remainingCalories.toFixed(0)} more calories and ${remainingProtein.toFixed(1)}g more protein today. Try adding lean protein sources like chicken breast, fish, or Greek yogurt.`,
      )
    } else {
      recommendations.push(
        `You need ${remainingCalories.toFixed(0)} more calories today. Consider healthy options like nuts, avocado, or whole grains.`,
      )
    }
  } else if (remainingProtein > 5) {
    recommendations.push(
      `You're close to your calorie goal but need ${remainingProtein.toFixed(1)}g more protein. Try low-calorie protein sources like egg whites or lean fish.`,
    )
  } else if (remainingCalories < -200) {
    recommendations.push(
      `You've exceeded your calorie goal by ${Math.abs(remainingCalories).toFixed(0)} calories. Consider lighter meals tomorrow or some extra physical activity.`,
    )
  } else {
    recommendations.push(`Great job! You're on track with your nutrition goals today. Keep up the good work!`)
  }

  // Add goal-specific recommendations
  if (user.goal_type === "gain") {
    recommendations.push(
      "For muscle gain, focus on protein-rich foods and don't forget healthy carbs for energy. Consider post-workout meals with both protein and carbs.",
    )
  } else if (user.goal_type === "loss") {
    recommendations.push(
      "For weight loss, prioritize protein to maintain muscle mass and include plenty of vegetables for nutrients and satiety.",
    )
  }

  return recommendations
}

export async function POST(request) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const today = new Date().toISOString().split("T")[0]

    // Get user and daily totals
    const user = await getUserById(user_id)
    const dailyTotals = await getDailyTotals(user_id, today)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const availableFoods = await getTopFoodsByNutrient("protcnt", 50)

    const recommendations = await GeminiClient.generateNutritionRecommendations(user, dailyTotals, availableFoods)

    // Save recommendations to database
    const savedRecommendations = []
    for (const rec of recommendations) {
      const saved = await saveRecommendation(user_id, rec)
      savedRecommendations.push(saved)
    }

    return NextResponse.json({
      success: true,
      recommendations: savedRecommendations,
      ai_powered: true, // Indicate AI-generated recommendations
    })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
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

    const recommendations = await getRecommendations(userId, date)

    return NextResponse.json({
      success: true,
      recommendations,
      date,
    })
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 })
  }
}
