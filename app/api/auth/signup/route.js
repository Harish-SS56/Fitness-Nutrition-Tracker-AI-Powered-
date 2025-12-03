import { NextResponse } from "next/server"
import { createUser, getUserByEmail, createSession } from "../../../../lib/database.js"
import {
  calculateBMI,
  categorizeBMI,
  suggestGoalType,
  calculateCalorieGoal,
  calculateProteinGoal,
} from "../../../../lib/bmi-calculator.js"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { name, email, password, height, weight, goal_type, calorie_goal, protein_goal } = await request.json()

    console.log("[v0] Signup attempt:", { name, email, height, weight, goal_type })

    // Validate required fields
    if (!name || !email || !password || !height || !weight) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

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
      password_hash,
      height,
      weight,
      bmi,
      bmi_category,
      goal_type: final_goal_type,
      calorie_goal: final_calorie_goal,
      protein_goal: final_protein_goal,
    }

    const user = await createUser(userData)

    // Create session
    const sessionId = await createSession(user.user_id)

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        bmi: user.bmi,
        bmi_category: user.bmi_category,
        goal_type: user.goal_type,
        calorie_goal: user.calorie_goal,
        protein_goal: user.protein_goal,
      },
    })

    // Set session cookie
    response.cookies.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("[v0] Error in signup:", error)
    return NextResponse.json({ error: "Failed to create user: " + error.message }, { status: 500 })
  }
}
