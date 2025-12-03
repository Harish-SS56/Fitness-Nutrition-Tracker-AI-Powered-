import { NextResponse } from "next/server"
import { AchievementService } from "../../../../lib/achievement-service.js"

// Force sync achievements for a user
export async function POST(request) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[Force Sync] Starting comprehensive achievement sync for user:", user_id)

    // Step 1: Initialize user achievements if not already done
    console.log("[Force Sync] Step 1: Initializing user achievements...")
    await AchievementService.initializeUserAchievements(user_id)

    // Step 2: Force recalculate all achievements
    console.log("[Force Sync] Step 2: Recalculating all achievements...")
    const newAchievements = await AchievementService.checkMealAchievements(user_id)

    // Step 3: Check consistency and streak achievements
    console.log("[Force Sync] Step 3: Checking consistency achievements...")
    await AchievementService.checkConsistencyAchievements(user_id)

    console.log("[Force Sync] Comprehensive sync completed, newly earned:", newAchievements.length)

    return NextResponse.json({
      success: true,
      newly_earned: newAchievements,
      message: `Comprehensive achievement sync completed for user ${user_id}`,
      steps_completed: [
        "User achievements initialized",
        "Daily achievements recalculated", 
        "Consistency achievements checked"
      ]
    })

  } catch (error) {
    console.error("[Force Sync] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      steps_completed: []
    }, { status: 500 })
  }
}
