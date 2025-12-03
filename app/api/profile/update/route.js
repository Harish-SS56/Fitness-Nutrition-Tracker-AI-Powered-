import { NextResponse } from "next/server"
import { getSessionUser, updateUser } from "../../../../lib/database.js"

export async function PUT(request) {
  try {
    const sessionId = request.cookies.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const currentUser = await getSessionUser(sessionId)
    if (!currentUser) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const updateData = await request.json()
    console.log("[v0] Profile update request:", updateData)

    // Validate required fields
    if (!updateData.name || !updateData.height || !updateData.weight) {
      return NextResponse.json({ error: "Name, height, and weight are required" }, { status: 400 })
    }

    // Update user in database
    const updatedUser = await updateUser(currentUser.user_id, updateData)

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error("[v0] Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile: " + error.message }, { status: 500 })
  }
}
