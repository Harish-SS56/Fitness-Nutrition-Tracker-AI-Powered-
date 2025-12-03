import { NextResponse } from "next/server"
import emailScheduler from "../../../../lib/email-scheduler.js"

// Initialize email scheduler when app starts
export async function POST(request) {
  try {
    console.log("📧 Initializing email scheduler...")
    
    // Start the daily reminder scheduler
    emailScheduler.startDailyReminders()
    
    const status = emailScheduler.getStatus()
    
    return NextResponse.json({
      success: true,
      message: "Email scheduler initialized successfully",
      scheduler: status
    })

  } catch (error) {
    console.error("Error initializing email scheduler:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Get initialization status
export async function GET(request) {
  try {
    const status = emailScheduler.getStatus()
    
    return NextResponse.json({
      success: true,
      scheduler: status,
      message: "Email scheduler status retrieved"
    })

  } catch (error) {
    console.error("Error getting scheduler status:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
