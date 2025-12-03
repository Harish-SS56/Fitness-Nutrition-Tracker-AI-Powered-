import { NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

// Get email scheduler status
export async function GET() {
  try {
    console.log("📧 Getting Python email scheduler status...")
    
    // Path to Python scheduler
    const pythonScriptPath = path.join(process.cwd(), 'python_email_service', 'email_scheduler.py')
    
    // Execute Python script to get status
    const result = await new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [pythonScriptPath, 'status'], {
        cwd: path.join(process.cwd(), 'python_email_service')
      })
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const jsonOutput = stdout.trim().split('\n').pop()
            const result = JSON.parse(jsonOutput)
            resolve(result)
          } catch (parseError) {
            resolve({
              success: true,
              message: 'Python scheduler status retrieved',
              is_running: false
            })
          }
        } else {
          reject(new Error(`Python script exited with code ${code}: ${stderr}`))
        }
      })
    })

    return NextResponse.json({
      success: true,
      scheduler: result,
      message: result.is_running ? "Email scheduler is running" : "Email scheduler is stopped"
    })

  } catch (error) {
    console.error("Error getting Python scheduler status:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Control email scheduler
export async function POST(request) {
  try {
    const requestBody = await request.json()
    const { action, testDelayMinutes, hour, minute } = requestBody

    let result = {}

    switch (action) {
      case 'start':
        emailScheduler.startDailyReminders()
        result = {
          success: true,
          message: "Daily email scheduler started - will send reminders at 9:00 AM IST",
          status: emailScheduler.getStatus()
        }
        break

      case 'stop':
        emailScheduler.stopDailyReminders()
        result = {
          success: true,
          message: "Daily email scheduler stopped",
          status: emailScheduler.getStatus()
        }
        break

      case 'trigger':
        console.log("📧 Manual trigger requested via API")
        const triggerResult = await emailScheduler.triggerManualReminder()
        result = {
          success: true,
          message: "Manual reminder triggered",
          triggerResult: triggerResult,
          status: emailScheduler.getStatus()
        }
        break

      case 'test':
        const delayMinutes = testDelayMinutes || 1
        console.log(`📧 Test email scheduled for ${delayMinutes} minute(s)`)
        emailScheduler.scheduleTestEmail(delayMinutes)
        result = {
          success: true,
          message: `Test email scheduled in ${delayMinutes} minute(s)`,
          status: emailScheduler.getStatus()
        }
        break

      case 'schedule_specific':
        console.log(`📧 Scheduling test email for ${hour}:${minute}`)
        emailScheduler.scheduleSpecificTime(hour, minute)
        result = {
          success: true,
          message: `Test email scheduled for ${hour}:${minute} today`,
          status: emailScheduler.getStatus()
        }
        break

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action. Use 'start', 'stop', 'trigger', or 'test'"
        }, { status: 400 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("Error controlling email scheduler:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
