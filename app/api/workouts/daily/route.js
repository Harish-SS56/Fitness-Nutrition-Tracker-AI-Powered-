import { NextResponse } from "next/server"
import { getSessionUser, getDailyWorkouts, getTotalCaloriesBurned } from "../../../../lib/database.js"

export async function GET(request) {
  try {
    const sessionId = request.cookies.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const currentUser = await getSessionUser(sessionId)
    if (!currentUser) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split("T")[0]

    // Get daily workouts and total calories burned
    const workouts = await getDailyWorkouts(currentUser.user_id, date)
    const totalCaloriesBurned = await getTotalCaloriesBurned(currentUser.user_id, date)

    return NextResponse.json({
      success: true,
      workouts,
      totalCaloriesBurned,
      date,
    })
  } catch (error) {
    console.error("[v0] Error getting daily workouts:", error)
    return NextResponse.json({ error: "Failed to get workouts: " + error.message }, { status: 500 })
  }
}
