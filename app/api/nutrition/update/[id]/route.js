import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

export async function PUT(request, { params }) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params
    const { name, enerc, protcnt, fat, chocdf, fibtg } = await request.json()

    console.log("[Nutrition Update] Updating food ID:", id, "with data:", { name, enerc, protcnt, fat, chocdf, fibtg })

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Food name is required" }, { status: 400 })
    }

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid food ID is required" }, { status: 400 })
    }

    // Check if food exists
    const existing = await sql`
      SELECT food_id FROM nutrition WHERE food_id = ${parseInt(id)}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 })
    }

    // Update food item
    const result = await sql`
      UPDATE nutrition 
      SET 
        name = ${name.trim()},
        enerc = ${parseFloat(enerc) || 0},
        protcnt = ${parseFloat(protcnt) || 0},
        fatce = ${parseFloat(fat) || 0},
        choavldf = ${parseFloat(chocdf) || 0},
        fibtg = ${parseFloat(fibtg) || 0}
      WHERE food_id = ${parseInt(id)}
      RETURNING food_id, name, enerc, protcnt, fatce as fat, choavldf as chocdf, fibtg
    `

    console.log("[Nutrition Update] Successfully updated food:", result[0])

    return NextResponse.json({
      success: true,
      food: result[0],
      message: "Food item updated successfully"
    })
    
  } catch (error) {
    console.error("[Nutrition Update] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
