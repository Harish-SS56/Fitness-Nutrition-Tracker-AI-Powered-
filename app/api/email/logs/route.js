import { NextResponse } from "next/server"
import EmailService from "../../../../lib/email-service.js"

// Get email logs and statistics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const days = parseInt(searchParams.get("days")) || 30
    const limit = parseInt(searchParams.get("limit")) || 50

    const emailService = new EmailService()

    if (userId) {
      // Get logs for specific user
      const logs = await emailService.getUserEmailLogs(parseInt(userId), limit)
      
      return NextResponse.json({
        success: true,
        logs: logs,
        user_id: parseInt(userId)
      })
    } else {
      // Get overall email statistics
      const stats = await emailService.getEmailStatistics(days)
      
      return NextResponse.json({
        success: true,
        statistics: stats,
        days: days
      })
    }

  } catch (error) {
    console.error("Error fetching email logs:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
