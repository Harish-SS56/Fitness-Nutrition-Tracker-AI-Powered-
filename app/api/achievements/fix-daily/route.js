import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

// Fix daily achievements with direct calculation
export async function POST(request) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[Fix Daily] Fixing daily achievements for user:", user_id)

    // Step 1: Check if user exists
    const userCheck = await sql`
      SELECT user_id, name, calorie_goal, protein_goal FROM users WHERE user_id = ${parseInt(user_id)}
    `

    if (userCheck.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `User ${user_id} does not exist` 
      }, { status: 404 })
    }

    const user = userCheck[0]
    console.log("[Fix Daily] User found:", user.name)

    // Step 2: Get today's meal totals
    const today = new Date().toISOString().split('T')[0]
    const todayTotals = await sql`
      SELECT 
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(protein), 0) as total_protein
      FROM meals 
      WHERE user_id = ${parseInt(user_id)} 
        AND meal_date = ${today}
    `

    const totals = todayTotals[0]
    console.log("[Fix Daily] Today's totals:", totals)

    // Step 3: Calculate progress
    const calorieProgress = user.calorie_goal > 0 ? totals.total_calories / user.calorie_goal : 0
    const proteinProgress = user.protein_goal > 0 ? totals.total_protein / user.protein_goal : 0

    console.log("[Fix Daily] Calculated progress:", {
      calories: `${totals.total_calories}/${user.calorie_goal} = ${(calorieProgress * 100).toFixed(1)}%`,
      protein: `${totals.total_protein}/${user.protein_goal} = ${(proteinProgress * 100).toFixed(1)}%`
    })

    // Step 4: Get achievement IDs
    const achievements = await sql`
      SELECT achievement_id, name FROM achievements 
      WHERE name IN ('Daily Calorie Goal', 'Daily Protein Goal', 'Balanced Day')
      AND is_active = true
    `

    const updates = []

    // Step 5: Update each achievement directly
    for (const achievement of achievements) {
      let progressValue = 0
      
      if (achievement.name === 'Daily Calorie Goal') {
        progressValue = calorieProgress
      } else if (achievement.name === 'Daily Protein Goal') {
        progressValue = proteinProgress
      } else if (achievement.name === 'Balanced Day') {
        progressValue = (calorieProgress >= 0.8 && proteinProgress >= 0.8) ? 1 : 0
      }

      const isEarned = progressValue >= 1

      // Update or insert the achievement
      await sql`
        INSERT INTO user_achievements (user_id, achievement_id, current_progress, is_earned, earned_at, updated_at)
        VALUES (
          ${parseInt(user_id)}, 
          ${achievement.achievement_id}, 
          ${progressValue}, 
          ${isEarned},
          ${isEarned ? sql`NOW()` : null},
          NOW()
        )
        ON CONFLICT (user_id, achievement_id) 
        DO UPDATE SET 
          current_progress = ${progressValue},
          is_earned = ${isEarned},
          earned_at = CASE WHEN ${isEarned} AND user_achievements.is_earned = false THEN NOW() ELSE user_achievements.earned_at END,
          updated_at = NOW()
      `

      updates.push({
        achievement: achievement.name,
        progress: progressValue,
        percentage: (progressValue * 100).toFixed(1) + '%',
        earned: isEarned
      })

      console.log(`[Fix Daily] Updated ${achievement.name}: ${(progressValue * 100).toFixed(1)}% ${isEarned ? '(EARNED!)' : ''}`)
    }

    return NextResponse.json({
      success: true,
      message: `Daily achievements fixed for user ${user.name}`,
      user_data: {
        name: user.name,
        calorie_goal: user.calorie_goal,
        protein_goal: user.protein_goal
      },
      today_totals: totals,
      updates: updates
    })

  } catch (error) {
    console.error("[Fix Daily] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
