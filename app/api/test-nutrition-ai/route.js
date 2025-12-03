import { NextResponse } from "next/server"
import { searchNutritionWithAI } from "../../../lib/database.js"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const foodName = searchParams.get("food") || "chapathi"

  try {
    console.log(`[Test Nutrition AI] Testing food: ${foodName}`)
    
    const result = await searchNutritionWithAI(foodName)
    
    return NextResponse.json({
      success: true,
      food: foodName,
      result,
      message: result.found 
        ? `Found nutrition for ${foodName} via ${result.source}` 
        : `Could not find nutrition for ${foodName}`
    })
    
  } catch (error) {
    console.error("[Test Nutrition AI] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      food: foodName
    })
  }
}

export async function POST(request) {
  try {
    const { foods } = await request.json()
    
    if (!foods || !Array.isArray(foods)) {
      return NextResponse.json({ error: "Please provide an array of food names" }, { status: 400 })
    }

    const results = []
    
    for (const food of foods) {
      console.log(`[Test Nutrition AI] Testing: ${food}`)
      const result = await searchNutritionWithAI(food)
      results.push({
        food,
        ...result
      })
    }

    return NextResponse.json({
      success: true,
      tested_foods: foods,
      results,
      summary: {
        total: foods.length,
        found_in_db: results.filter(r => r.source === "database").length,
        calculated_by_ai: results.filter(r => r.source === "ai_calculated").length,
        failed: results.filter(r => !r.found).length
      }
    })
    
  } catch (error) {
    console.error("[Test Nutrition AI] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}
