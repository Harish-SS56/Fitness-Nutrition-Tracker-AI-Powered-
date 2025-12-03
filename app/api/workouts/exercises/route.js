import { NextResponse } from "next/server"
import { getAllExercises, getExercisesByCategory } from "../../../../lib/database.js"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let exercises
    if (category) {
      exercises = await getExercisesByCategory(category)
    } else {
      exercises = await getAllExercises()
    }

    return NextResponse.json({
      success: true,
      exercises,
    })
  } catch (error) {
    console.error("[v0] Error getting exercises:", error)
    return NextResponse.json({ error: "Failed to get exercises: " + error.message }, { status: 500 })
  }
}
