import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

// Debug achievements for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[Achievement Debug] Debugging for user:", userId)

    // Check if user exists
    const userCheck = await sql`
      SELECT user_id, name, calorie_goal, protein_goal FROM users WHERE user_id = ${parseInt(userId)}
    `

    // Get user's meals for today
    const today = new Date().toISOString().split('T')[0]
    const todayMeals = await sql`
      SELECT 
        meal_text,
        calories,
        protein,
        meal_date,
        created_at
      FROM meals 
      WHERE user_id = ${parseInt(userId)} 
        AND meal_date = ${today}
      ORDER BY created_at DESC
    `

    // Calculate today's totals
    const todayTotals = await sql`
      SELECT 
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(protein), 0) as total_protein
      FROM meals 
      WHERE user_id = ${parseInt(userId)} 
        AND meal_date = ${today}
    `

    // Get user achievements
    const userAchievements = await sql`
      SELECT 
        a.name,
        a.target_value,
        a.target_unit,
        ua.current_progress,
        ua.is_earned,
        ua.updated_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ${parseInt(userId)}
      WHERE a.is_active = true
      ORDER BY a.name
    `

    // Calculate expected progress for daily achievements
    const user = userCheck[0]
    const totals = todayTotals[0]
    
    let expectedCalorieProgress = 0
    let expectedProteinProgress = 0
    
    if (user && user.calorie_goal > 0) {
      expectedCalorieProgress = totals.total_calories / user.calorie_goal
    }
    
    if (user && user.protein_goal > 0) {
      expectedProteinProgress = totals.total_protein / user.protein_goal
    }

    return NextResponse.json({
      success: true,
      debug_info: {
        user_exists: userCheck.length > 0,
        user_data: user,
        today_meals: todayMeals,
        today_totals: totals,
        expected_progress: {
          calorie_progress: expectedCalorieProgress,
          protein_progress: expectedProteinProgress,
          calorie_percentage: (expectedCalorieProgress * 100).toFixed(1) + '%',
          protein_percentage: (expectedProteinProgress * 100).toFixed(1) + '%'
        },
        user_achievements: userAchievements,
        achievement_count: userAchievements.length,
        initialized_achievements: userAchievements.filter(a => a.current_progress !== null).length
      }
    })

  } catch (error) {
    console.error("[Achievement Debug] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
