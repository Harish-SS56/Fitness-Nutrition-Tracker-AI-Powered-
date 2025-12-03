import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

export async function POST(request) {
  try {
    const { name, enerc, protcnt, fat, chocdf, fibtg } = await request.json()

    console.log("[Nutrition Add] Adding new food:", { name, enerc, protcnt, fat, chocdf, fibtg })

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Food name is required" }, { status: 400 })
    }

    // Check if food already exists
    const existing = await sql`
      SELECT food_id FROM nutrition WHERE LOWER(name) = LOWER(${name.trim()})
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Food item already exists" }, { status: 400 })
    }

    // Insert new food item (using correct column names)
    const result = await sql`
      INSERT INTO nutrition (name, enerc, protcnt, fatce, choavldf, fibtg)
      VALUES (
        ${name.trim()},
        ${parseFloat(enerc) || 0},
        ${parseFloat(protcnt) || 0},
        ${parseFloat(fat) || 0},
        ${parseFloat(chocdf) || 0},
        ${parseFloat(fibtg) || 0}
      )
      RETURNING food_id, name, enerc, protcnt, fatce as fat, choavldf as chocdf, fibtg
    `

    console.log("[Nutrition Add] Successfully added food:", result[0])

    return NextResponse.json({
      success: true,
      food: result[0],
      message: "Food item added successfully"
    })
    
  } catch (error) {
    console.error("[Nutrition Add] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
