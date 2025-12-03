import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    console.log("[Meal Delete] Deleting meal ID:", id)

    // Check if meal exists
    const existing = await sql`
      SELECT meal_id, meal_text, user_id FROM meals WHERE meal_id = ${parseInt(id)}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 })
    }

    // Delete meal
    await sql`
      DELETE FROM meals WHERE meal_id = ${parseInt(id)}
    `

    console.log("[Meal Delete] Successfully deleted meal:", existing[0].meal_text)

    // CRITICAL: Recalculate achievements after meal deletion
    try {
      const user_id = existing[0].user_id
      console.log("[Meal Delete] Recalculating achievements for user:", user_id)
      
      // Call the achievement recalculation API
      const achievementResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/achievements/direct-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
      })
      
      if (achievementResponse.ok) {
        console.log("[Meal Delete] Achievements recalculated successfully")
      } else {
        console.log("[Meal Delete] Failed to recalculate achievements")
      }
    } catch (error) {
      console.log("[Meal Delete] Error recalculating achievements:", error)
      // Don't fail the delete if achievement recalculation fails
    }

    return NextResponse.json({
      success: true,
      message: "Meal deleted successfully"
    })
    
  } catch (error) {
    console.error("[Meal Delete] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
