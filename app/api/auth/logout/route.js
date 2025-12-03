import { NextResponse } from "next/server"
import { deleteSession } from "../../../../lib/database.js"

export async function POST(request) {
  try {
    console.log("[v0] Logout request received")
    
    const sessionId = request.cookies.get("session")?.value
    console.log("[v0] Session ID:", sessionId ? "present" : "not found")

    if (sessionId) {
      try {
        await deleteSession(sessionId)
        console.log("[v0] Session deleted successfully")
      } catch (dbError) {
        console.error("[v0] Database error during session deletion:", dbError)
        // Continue anyway - don't fail logout for DB issues
      }
    }

    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    })
    
    // Clear the session cookie
    response.cookies.set("session", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    })
    
    console.log("[v0] Logout completed successfully")
    return response
    
  } catch (error) {
    console.error("[v0] Error in logout:", error)
    
    // Even if there's an error, try to clear the cookie
    const response = NextResponse.json({ 
      success: true, 
      message: "Logout completed (with warnings)" 
    })
    
    response.cookies.set("session", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    })
    
    return response
  }
}
