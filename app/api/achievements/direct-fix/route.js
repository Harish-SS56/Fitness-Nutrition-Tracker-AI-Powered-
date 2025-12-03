import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

// Direct fix for achievements - bypasses all complex logic
export async function POST(request) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[Direct Fix] Starting direct fix for user:", user_id)

    // Step 1: Get user info - ONLY for the requested user (no fallback to other users)
    const users = await sql`
      SELECT user_id, name, calorie_goal, protein_goal 
      FROM users 
      WHERE user_id = ${parseInt(user_id)}
    `

    if (users.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `User ${user_id} not found. Please make sure you are logged in correctly.` 
      }, { status: 404 })
    }

    const user = users[0]
    console.log("[Direct Fix] User found:", user.name)

    // Step 2: Get today's meals
    const today = new Date().toISOString().split('T')[0]
    const meals = await sql`
      SELECT COALESCE(SUM(calories), 0) as total_calories, COALESCE(SUM(protein), 0) as total_protein
      FROM meals 
      WHERE user_id = ${parseInt(user.user_id)} AND meal_date = ${today}
    `

    const totals = meals[0]
    console.log("[Direct Fix] Today's totals:", totals)

    // Step 3: Calculate progress
    const calorieProgress = user.calorie_goal > 0 ? totals.total_calories / user.calorie_goal : 0
    const proteinProgress = user.protein_goal > 0 ? totals.total_protein / user.protein_goal : 0

    console.log("[Direct Fix] Calculated progress:", {
      calorie: `${totals.total_calories}/${user.calorie_goal} = ${(calorieProgress * 100).toFixed(1)}%`,
      protein: `${totals.total_protein}/${user.protein_goal} = ${(proteinProgress * 100).toFixed(1)}%`
    })

    // Step 4: Get ALL achievements
    const allAchievements = await sql`
      SELECT achievement_id, name, achievement_type, target_value, target_unit, category
      FROM achievements 
      WHERE is_active = true
    `

    const results = []

    // Step 5: Calculate progress for ALL achievements
    for (const achievement of allAchievements) {
      let progress = 0
      
      // Daily achievements
      if (achievement.name === 'Daily Calorie Goal') {
        progress = calorieProgress
      } else if (achievement.name === 'Daily Protein Goal') {
        progress = proteinProgress  
      } else if (achievement.name === 'Balanced Day') {
        progress = (calorieProgress >= 0.8 && proteinProgress >= 0.8) ? 1 : 0
      }
      
      // Milestone achievements
      else if (achievement.name === 'First Goal') {
        // Check if user has ever met daily goals
        const goalDays = await sql`
          SELECT COUNT(DISTINCT meal_date) as days
          FROM (
            SELECT meal_date, SUM(calories) as daily_calories, SUM(protein) as daily_protein
            FROM meals 
            WHERE user_id = ${parseInt(user.user_id)}
            GROUP BY meal_date
            HAVING SUM(calories) >= ${user.calorie_goal * 0.8} AND SUM(protein) >= ${user.protein_goal * 0.8}
          ) goal_days
        `
        progress = goalDays.length > 0 && goalDays[0].days > 0 ? 1 : 0
      }
      
      // Total achievements
      else if (achievement.name === 'Protein Master') {
        const totalProtein = await sql`
          SELECT COALESCE(SUM(protein), 0) as total FROM meals WHERE user_id = ${parseInt(user.user_id)}
        `
        progress = totalProtein.length > 0 ? totalProtein[0].total / 1000 : 0
      } else if (achievement.name === 'Calorie Counter') {
        const totalCalories = await sql`
          SELECT COALESCE(SUM(calories), 0) as total FROM meals WHERE user_id = ${parseInt(user.user_id)}
        `
        progress = totalCalories.length > 0 ? totalCalories[0].total / 50000 : 0
      } else if (achievement.name === 'Century Club') {
        const goalDays = await sql`
          SELECT COUNT(DISTINCT meal_date) as days
          FROM (
            SELECT meal_date, SUM(calories) as daily_calories, SUM(protein) as daily_protein
            FROM meals 
            WHERE user_id = ${parseInt(user.user_id)}
            GROUP BY meal_date
            HAVING SUM(calories) >= ${user.calorie_goal * 0.8} AND SUM(protein) >= ${user.protein_goal * 0.8}
          ) goal_days
        `
        progress = goalDays.length > 0 ? goalDays[0].days / 100 : 0
      }
      
      // Weekly/Monthly consistency achievements
      else if (achievement.name === 'Weekly Warrior') {
        const weeklyDays = await sql`
          SELECT COUNT(DISTINCT meal_date) as days
          FROM (
            SELECT meal_date, SUM(calories) as daily_calories, SUM(protein) as daily_protein
            FROM meals 
            WHERE user_id = ${parseInt(user.user_id)} 
              AND meal_date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY meal_date
            HAVING SUM(calories) >= ${user.calorie_goal * 0.8} AND SUM(protein) >= ${user.protein_goal * 0.8}
          ) goal_days
        `
        progress = weeklyDays.length > 0 ? weeklyDays[0].days / 5 : 0
      } else if (achievement.name === 'Perfect Week') {
        const weeklyDays = await sql`
          SELECT COUNT(DISTINCT meal_date) as days
          FROM (
            SELECT meal_date, SUM(calories) as daily_calories, SUM(protein) as daily_protein
            FROM meals 
            WHERE user_id = ${parseInt(user.user_id)} 
              AND meal_date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY meal_date
            HAVING SUM(calories) >= ${user.calorie_goal * 0.8} AND SUM(protein) >= ${user.protein_goal * 0.8}
          ) goal_days
        `
        progress = weeklyDays.length > 0 ? weeklyDays[0].days / 7 : 0
      } else if (achievement.name === 'Monthly Champion') {
        const monthlyDays = await sql`
          SELECT COUNT(DISTINCT meal_date) as days
          FROM (
            SELECT meal_date, SUM(calories) as daily_calories, SUM(protein) as daily_protein
            FROM meals 
            WHERE user_id = ${parseInt(user.user_id)} 
              AND meal_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY meal_date
            HAVING SUM(calories) >= ${user.calorie_goal * 0.8} AND SUM(protein) >= ${user.protein_goal * 0.8}
          ) goal_days
        `
        progress = monthlyDays.length > 0 ? monthlyDays[0].days / 20 : 0
      } else if (achievement.name === 'Consistency King') {
        const monthlyDays = await sql`
          SELECT COUNT(DISTINCT meal_date) as days
          FROM (
            SELECT meal_date, SUM(calories) as daily_calories, SUM(protein) as daily_protein
            FROM meals 
            WHERE user_id = ${parseInt(user.user_id)} 
              AND meal_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY meal_date
            HAVING SUM(calories) >= ${user.calorie_goal * 0.8} AND SUM(protein) >= ${user.protein_goal * 0.8}
          ) goal_days
        `
        progress = monthlyDays.length > 0 ? monthlyDays[0].days / 25 : 0
      }
      
      // Streak achievements (simplified - just use recent goal days)
      else if (achievement.name.includes('Streak')) {
        const recentGoalDays = await sql`
          SELECT COUNT(DISTINCT meal_date) as days
          FROM (
            SELECT meal_date, SUM(calories) as daily_calories, SUM(protein) as daily_protein
            FROM meals 
            WHERE user_id = ${parseInt(user.user_id)} 
              AND meal_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY meal_date
            HAVING SUM(calories) >= ${user.calorie_goal * 0.8} AND SUM(protein) >= ${user.protein_goal * 0.8}
          ) goal_days
        `
        const targetDays = achievement.name.includes('3-Day') ? 3 : 
                          achievement.name.includes('7-Day') ? 7 : 30
        progress = recentGoalDays.length > 0 ? Math.min(recentGoalDays[0].days / targetDays, 1) : 0
      }

      // Fix earning logic - achievements should be earned at 100% progress, not 80%
      const isEarned = progress >= 1.0 // Must be exactly 100% or more
      
      // Cap progress at 1.0 for display purposes
      const displayProgress = Math.min(progress, 1.0)

      // Delete existing record first
      await sql`
        DELETE FROM user_achievements 
        WHERE user_id = ${parseInt(user.user_id)} AND achievement_id = ${achievement.achievement_id}
      `

      // Insert new record with proper logic
      await sql`
        INSERT INTO user_achievements (user_id, achievement_id, current_progress, is_earned, earned_at, created_at, updated_at)
        VALUES (
          ${parseInt(user.user_id)}, 
          ${achievement.achievement_id}, 
          ${displayProgress}, 
          ${isEarned},
          ${isEarned ? sql`NOW()` : null},
          NOW(),
          NOW()
        )
      `

      results.push({
        achievement: achievement.name,
        progress: progress,
        percentage: (progress * 100).toFixed(1) + '%',
        earned: isEarned,
        category: achievement.category
      })

      console.log(`[Direct Fix] ${achievement.name}: ${(progress * 100).toFixed(1)}% ${isEarned ? '(EARNED!)' : ''}`)
    }

    return NextResponse.json({
      success: true,
      message: `Direct fix completed for ${user.name} (ID: ${user.user_id})`,
      user_data: user,
      today_totals: totals,
      results: results,
      actual_user_id: user.user_id
    })

  } catch (error) {
    console.error("[Direct Fix] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
