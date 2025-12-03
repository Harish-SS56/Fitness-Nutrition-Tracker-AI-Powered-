import { NextResponse } from "next/server"
import { searchNutritionAdvanced, getNutritionStats } from "../../../../lib/nutrition-search.js"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      // Return nutrition stats if no query
      const stats = await getNutritionStats()
      return NextResponse.json({ success: true, stats })
    }

    const results = await searchNutritionAdvanced(query)

    return NextResponse.json({
      success: true,
      results,
      query,
      count: results.length,
    })
  } catch (error) {
    console.error("Error searching nutrition:", error)
    return NextResponse.json({ error: "Failed to search nutrition database" }, { status: 500 })
  }
}
