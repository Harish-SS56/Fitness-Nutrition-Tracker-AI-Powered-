import { NextResponse } from "next/server"
import { createUser, sql } from "../../../lib/database.js"
import {
  calculateBMI,
  categorizeBMI,
  suggestGoalType,
  calculateCalorieGoal,
  calculateProteinGoal,
} from "../../../lib/bmi-calculator.js"

export async function POST(request) {
  try {
    const { name, email, height, weight, goal_type, calorie_goal, protein_goal } = await request.json()

    // Validate required fields
    if (!name || !email || !height || !weight) {
      return NextResponse.json({ error: "Name, email, height, and weight are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    // Calculate BMI and category
    const bmi = calculateBMI(weight, height)
    const bmi_category = categorizeBMI(bmi)
    const suggested_goal = suggestGoalType(bmi)

    // Use provided goals or calculate defaults
    const final_goal_type = goal_type || suggested_goal
    const final_calorie_goal = calorie_goal || calculateCalorieGoal(weight, height, 25, "male", final_goal_type)
    const final_protein_goal = protein_goal || calculateProteinGoal(weight, final_goal_type)

    // Create user in database
    const userData = {
      name,
      email,
      height,
      weight,
      bmi,
      bmi_category,
      goal_type: final_goal_type,
      calorie_goal: final_calorie_goal,
      protein_goal: final_protein_goal,
    }

    const user = await createUser(userData)

    // Initialize email preferences for new user (only if table exists)
    try {
      // Check if email_preferences table exists first
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'email_preferences'
        )
      `
      
      if (tableExists[0].exists) {
        await sql`
          INSERT INTO email_preferences (user_id, daily_reminders_enabled, achievement_notifications_enabled, reminder_time)
          VALUES (${user.user_id}, true, true, '09:00:00')
          ON CONFLICT (user_id) DO NOTHING
        `
        console.log("[v0] Email preferences initialized for user:", user.user_id)
      } else {
        console.log("[v0] Email preferences table not found, skipping initialization")
      }
    } catch (emailPrefError) {
      console.error("[v0] Error initializing email preferences:", emailPrefError)
      // Don't fail user creation if email preferences fail
    }

    // Initialize user achievements
    try {
      const { AchievementService } = await import('../../../lib/achievement-service.js')
      await AchievementService.initializeUserAchievements(user.user_id)
      console.log("[v0] Achievements initialized for user:", user.user_id)
    } catch (achievementError) {
      console.error("[v0] Error initializing achievements:", achievementError)
    }

    return NextResponse.json({
      success: true,
      user,
      suggestions: {
        bmi,
        bmi_category,
        suggested_goal,
        suggested_calorie_goal: calculateCalorieGoal(weight, height, 25, "male", suggested_goal),
        suggested_protein_goal: calculateProteinGoal(weight, suggested_goal),
      },
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
