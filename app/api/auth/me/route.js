import { NextResponse } from "next/server"
import { getSessionUser } from "../../../../lib/database.js"

export async function GET(request) {
  try {
    const sessionId = request.cookies.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await getSessionUser(sessionId)
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
  }
}
