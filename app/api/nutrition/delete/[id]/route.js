import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

export async function DELETE(request, { params }) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params

    console.log("[Nutrition Delete] Deleting food ID:", id)

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid food ID is required" }, { status: 400 })
    }

    // Check if food exists
    const existing = await sql`
      SELECT food_id, name FROM nutrition WHERE food_id = ${parseInt(id)}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 })
    }

    // Delete food item
    await sql`
      DELETE FROM nutrition WHERE food_id = ${parseInt(id)}
    `

    console.log("[Nutrition Delete] Successfully deleted food:", existing[0].name)

    return NextResponse.json({
      success: true,
      message: `Food item "${existing[0].name}" deleted successfully`
    })
    
  } catch (error) {
    console.error("[Nutrition Delete] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
