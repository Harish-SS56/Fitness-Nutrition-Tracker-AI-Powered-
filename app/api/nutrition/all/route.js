import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

export async function GET() {
  try {
    console.log("[Nutrition All] Fetching all nutrition data...")
    
    const result = await sql`
      SELECT 
        food_id,
        name,
        enerc,
        protcnt,
        fatce as fat,
        choavldf as chocdf,
        fibtg,
        water
      FROM nutrition 
      ORDER BY name ASC
      LIMIT 1000
    `

    console.log(`[Nutrition All] Found ${result.length} nutrition items`)

    return NextResponse.json({
      success: true,
      nutrition: result,
      total: result.length
    })
    
  } catch (error) {
    console.error("[Nutrition All] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
