import { NextResponse } from "next/server"
import { GeminiClient } from "../../../../lib/gemini-client.js"
import { getUserById, getDailyTotals, getDailyWorkouts, getTotalCaloriesBurned } from "../../../../lib/database.js"

export async function POST(request) {
  try {
    console.log("[AI Chat] Processing chat request...")
    const { message, user_id } = await request.json()

    console.log("[AI Chat] Message:", message)
    console.log("[AI Chat] User ID:", user_id)

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    let context = ""

    // If user_id is provided, get user context
    if (user_id) {
      console.log("[AI Chat] Getting user context...")
      try {
        const user = await getUserById(user_id)
        console.log("[AI Chat] User found:", user ? "Yes" : "No")
        
        const today = new Date().toISOString().split("T")[0]
        const dailyTotals = await getDailyTotals(user_id, today)
        const dailyWorkouts = await getDailyWorkouts(user_id, today)
        const totalCaloriesBurned = await getTotalCaloriesBurned(user_id, today)
        
        console.log("[AI Chat] Daily totals:", dailyTotals)
        console.log("[AI Chat] Daily workouts:", dailyWorkouts?.length || 0, "workouts")
        console.log("[AI Chat] Calories burned:", totalCaloriesBurned)

        if (user) {
          // Calculate net calories
          const netCalories = dailyTotals.total_calories - totalCaloriesBurned
          
          // Build workout summary
          let workoutSummary = ""
          if (dailyWorkouts && dailyWorkouts.length > 0) {
            workoutSummary = `
Today's Workouts:
${dailyWorkouts.map(w => `- ${w.exercise_name}: ${w.duration_minutes} minutes (${w.calories_burned} calories burned)`).join('\n')}
Total calories burned: ${totalCaloriesBurned}`
          } else {
            workoutSummary = "- No workouts logged today"
          }

          context = `
User Context:
- Name: ${user.name}
- Goal: ${user.goal_type}
- Daily calorie goal: ${user.calorie_goal}
- Daily protein goal: ${user.protein_goal}g

Today's Nutrition:
- Calories consumed: ${dailyTotals.total_calories}
- Calories burned through exercise: ${totalCaloriesBurned}
- NET calories: ${netCalories}
- Protein consumed: ${dailyTotals.total_protein}g
- Fat: ${dailyTotals.total_fat}g
- Carbs: ${dailyTotals.total_carbs}g
- Fiber: ${dailyTotals.total_fiber}g

${workoutSummary}

Progress:
- Calorie progress: ${netCalories}/${user.calorie_goal} (${((netCalories/user.calorie_goal)*100).toFixed(1)}%)
- Protein progress: ${dailyTotals.total_protein}/${user.protein_goal}g (${((dailyTotals.total_protein/user.protein_goal)*100).toFixed(1)}%)
`
          console.log("[AI Chat] Enhanced context prepared with workout data")
        }
      } catch (dbError) {
        console.error("[AI Chat] Database error:", dbError)
        // Continue without context if DB fails
      }
    }

    const prompt = `
You are a helpful nutrition and fitness assistant. Answer the user's question with accurate, practical advice.

${context}

User Question: "${message}"

Please provide a helpful, concise response. If the question is about nutrition or fitness, give specific, actionable advice. If you need to recommend foods, suggest common, easily available options.

Keep your response conversational and encouraging.
`

    console.log("[AI Chat] Calling Gemini API...")
    const response = await GeminiClient.generateContent(prompt)
    console.log("[AI Chat] Gemini response received:", response ? "Yes" : "No")

    return NextResponse.json({
      success: true,
      response: response.trim(),
      ai_powered: true,
    })
  } catch (error) {
    console.error("[AI Chat] Error in AI chat:", error)
    console.error("[AI Chat] Error stack:", error.stack)
    
    // Handle rate limiting gracefully
    if (error.message.includes("Rate limit exceeded")) {
      return NextResponse.json({
        success: true,
        response: "I'm currently experiencing high demand. Please wait a moment and try your question again. In the meantime, I recommend focusing on balanced nutrition with plenty of vegetables, lean proteins, and staying hydrated!",
        ai_powered: false,
        rate_limited: true
      })
    }
    
    return NextResponse.json({ 
      error: "Failed to generate AI response: " + error.message 
    }, { status: 500 })
  }
}
