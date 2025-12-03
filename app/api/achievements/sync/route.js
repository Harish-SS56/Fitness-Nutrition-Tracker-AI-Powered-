import { NextResponse } from "next/server"
import { AchievementService } from "../../../../lib/achievement-service.js"

// Sync user achievements with current progress
export async function POST(request) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[Achievement Sync] Syncing achievements for user:", user_id)

    // Check and update all achievements for this user
    const newAchievements = await AchievementService.checkMealAchievements(user_id)
    
    // Also check consistency achievements
    const consistencyUpdates = await AchievementService.checkConsistencyAchievements(user_id)
    
    console.log(`[Achievement Sync] Sync completed: ${newAchievements.length} newly earned`)

    return NextResponse.json({
      success: true,
      newly_earned: newAchievements,
      message: "Achievements synced successfully"
    })

  } catch (error) {
    console.error("[Achievement Sync] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
