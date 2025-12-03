import { NextResponse } from "next/server"
import { getUserByEmail, createSession } from "../../../../lib/database.js"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    console.log("[v0] Login attempt:", { email })

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Get user by email
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create session
    const sessionId = await createSession(user.user_id)

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        height: user.height,
        weight: user.weight,
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
    console.error("[v0] Error in login:", error)
    return NextResponse.json({ error: "Login failed: " + error.message }, { status: 500 })
  }
}
