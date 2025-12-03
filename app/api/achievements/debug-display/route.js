import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

// Debug what's actually being returned by the achievements API
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || '1'

    console.log("[Debug Display] Checking achievements display for user:", userId)

    // Find users with meal data
    const today = new Date().toISOString().split('T')[0]
    const usersWithMeals = await sql`
      SELECT DISTINCT u.user_id, u.name, u.calorie_goal, u.protein_goal,
             SUM(m.calories) as total_calories, SUM(m.protein) as total_protein
      FROM users u
      JOIN meals m ON u.user_id = m.user_id
      WHERE m.meal_date = ${today}
      GROUP BY u.user_id, u.name, u.calorie_goal, u.protein_goal
      ORDER BY u.user_id
    `

    if (usersWithMeals.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No users found with meal data today"
      })
    }

    const results = []

    for (const user of usersWithMeals) {
      // Test the exact same query that the achievements API uses
      const achievements = await sql`
        SELECT 
          a.achievement_id,
          a.name,
          a.achievement_type,
          a.target_value,
          a.target_unit,
          COALESCE(ua.is_earned, false) as is_earned,
          COALESCE(ua.current_progress, 0) as current_progress,
          ua.earned_at,
          CASE 
            WHEN ua.is_earned THEN 100
            WHEN a.achievement_type = 'daily' THEN LEAST(100, COALESCE(ua.current_progress, 0) * 100)
            WHEN a.target_value > 0 THEN LEAST(100, (COALESCE(ua.current_progress, 0) / a.target_value) * 100)
            ELSE 0
          END as progress_percentage
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ${parseInt(user.user_id)}
        WHERE a.is_active = true AND a.name LIKE '%Daily%'
        ORDER BY a.name
      `

      const calorieProgress = user.calorie_goal > 0 ? user.total_calories / user.calorie_goal : 0
      const proteinProgress = user.protein_goal > 0 ? user.total_protein / user.protein_goal : 0

      results.push({
        user_id: user.user_id,
        name: user.name,
        meal_data: {
          calories: `${user.total_calories}/${user.calorie_goal}`,
          protein: `${user.total_protein}g/${user.protein_goal}g`,
          calorie_progress: (calorieProgress * 100).toFixed(1) + '%',
          protein_progress: (proteinProgress * 100).toFixed(1) + '%'
        },
        achievements: achievements.map(a => ({
          name: a.name,
          current_progress: a.current_progress,
          progress_percentage: a.progress_percentage,
          achievement_type: a.achievement_type,
          target_value: a.target_value
        }))
      })
    }

    return NextResponse.json({
      success: true,
      debug_data: results,
      message: "This shows what the achievements API should return"
    })

  } catch (error) {
    console.error("[Debug Display] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
