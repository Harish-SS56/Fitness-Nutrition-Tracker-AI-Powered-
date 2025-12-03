import { NextResponse } from "next/server"
import { getUserById } from "../../../../lib/database.js"

export async function GET(request, { params }) {
  try {
    const userId = Number.parseInt(params.id)

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: "Valid user ID is required" }, { status: 400 })
    }

    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
