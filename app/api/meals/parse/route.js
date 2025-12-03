import { NextResponse } from "next/server"
import { searchNutritionWithAI } from "../../../../lib/database.js"
import { GeminiClient } from "../../../../lib/gemini-client.js"

export async function POST(request) {
  try {
    const { meal_text } = await request.json()

    if (!meal_text) {
      return NextResponse.json({ error: "Meal text is required" }, { status: 400 })
    }

    const parsed = await GeminiClient.parseMealText(meal_text)

    // Look up nutrition for each item
    const nutritionResults = []
    let totalCalories = 0
    let totalProtein = 0
    let totalFat = 0
    let totalCarbs = 0
    let totalFiber = 0

    for (const item of parsed.items) {
      console.log(`[Meal Parse] Processing item: ${item.name} (${item.quantity_g}g)`)
      
      const nutritionSearch = await searchNutritionWithAI(item.name)

      if (nutritionSearch.found && nutritionSearch.data.length > 0) {
        const bestMatch = nutritionSearch.data[0]
        
        // Calculate nutrition based on quantity
        const multiplier = item.quantity_g / 100 // Convert to per 100g basis
        const nutrition = {
          calories: Math.round((bestMatch.enerc || 0) * multiplier * 10) / 10,
          protein: Math.round((bestMatch.protcnt || 0) * multiplier * 10) / 10,
          fat: Math.round((bestMatch.fat || 0) * multiplier * 10) / 10,
          carbs: Math.round((bestMatch.chocdf || 0) * multiplier * 10) / 10,
          fiber: Math.round((bestMatch.fibtg || 0) * multiplier * 10) / 10,
        }

        nutritionResults.push({
          ...item,
          matched_food: bestMatch.name,
          nutrition,
          source: nutritionSearch.source,
          confidence: nutritionSearch.confidence || "high",
          ai_calculated: bestMatch.calculated_by_ai || false
        })

        totalCalories += nutrition.calories
        totalProtein += nutrition.protein
        totalFat += nutrition.fat
        totalCarbs += nutrition.carbs
        totalFiber += nutrition.fiber
        
        console.log(`[Meal Parse] ✅ Found nutrition for ${item.name} (${nutritionSearch.source}):`, nutrition)
      } else {
        console.log(`[Meal Parse] ❌ Could not find nutrition for ${item.name}`)
        nutritionResults.push({
          ...item,
          matched_food: null,
          nutrition: null,
          error: nutritionSearch.error || "Food not found and AI calculation failed",
          source: "error"
        })
      }
    }

    return NextResponse.json({
      success: true,
      original_text: meal_text,
      parsed_items: parsed.items,
      nutrition_results: nutritionResults,
      totals: {
        calories: Math.round(totalCalories * 10) / 10,
        protein: Math.round(totalProtein * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fiber: Math.round(totalFiber * 10) / 10,
      },
      ai_powered: true, // Indicate AI processing
    })
  } catch (error) {
    console.error("Error parsing meal:", error)
    return NextResponse.json({ error: "Failed to parse meal" }, { status: 500 })
  }
}
