import { NextResponse } from "next/server"
import { sql } from "../../../../lib/database.js"
import { spawn } from "child_process"
import path from "path"

// POST /api/email/send-real-test - Send actual test email via Python service
export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, emailType = 'daily_reminder' } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user data for personalized email
    const users = await sql`
      SELECT 
        user_id,
        name,
        email,
        calorie_goal,
        protein_goal
      FROM users 
      WHERE user_id = ${parseInt(userId)}
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    const user = users[0]

    if (!user.email) {
      return NextResponse.json({
        success: false,
        error: 'User has no email address'
      }, { status: 400 })
    }

    // Check email preferences
    const preferences = await sql`
      SELECT daily_reminders_enabled, achievement_notifications_enabled
      FROM email_preferences 
      WHERE user_id = ${parseInt(userId)}
    `

    const userPrefs = preferences.length > 0 ? preferences[0] : { 
      daily_reminders_enabled: true, 
      achievement_notifications_enabled: true 
    }

    // Check if user has email enabled for this type
    if (emailType === 'daily_reminder' && !userPrefs.daily_reminders_enabled) {
      return NextResponse.json({
        success: false,
        error: 'Daily reminders are disabled for this user'
      }, { status: 400 })
    }

    console.log(`📧 Sending REAL test email via Python service...`)
    console.log(`   User: ${user.name} (${user.email})`)
    console.log(`   Goals: ${user.calorie_goal}cal, ${user.protein_goal}g protein`)

    // Call Python email service with absolute paths and better error handling
    const pythonServicePath = path.join(process.cwd(), 'python_email_service')
    const pythonScript = path.join(pythonServicePath, 'email_service.py')
    
    console.log(`Python service path: ${pythonServicePath}`)
    console.log(`Python script: ${pythonScript}`)
    console.log(`Current working directory: ${process.cwd()}`)
    
    return new Promise((resolve) => {
      // Use absolute path and shell execution
      const command = `cd "${pythonServicePath}" && python email_service.py send_reminder "${user.email}" "${user.name}" "${user.calorie_goal}" "${user.protein_goal}"`
      console.log(`Executing command: ${command}`)
      
      const pythonProcess = spawn('cmd', ['/c', command], {
        stdio: 'pipe',
        shell: true,
        windowsHide: true
      })
      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString()
      })
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Python email service completed successfully`)
          console.log(`Output: ${output}`)
          
          resolve(NextResponse.json({
            success: true,
            message: `Real test email sent successfully to ${user.email} via Python service`,
            recipient: user.email,
            user_name: user.name,
            goals: {
              calories: user.calorie_goal,
              protein: user.protein_goal
            },
            python_output: output,
            method: 'python_email_service'
          }))
        } else {
          console.error(`❌ Python email service failed with code: ${code}`)
          console.error(`Error: ${errorOutput}`)
          
          resolve(NextResponse.json({
            success: false,
            error: `Python email service failed: ${errorOutput}`,
            exit_code: code
          }, { status: 500 }))
        }
      })

      pythonProcess.on('error', (error) => {
        console.error(`❌ Failed to start Python process: ${error.message}`)
        resolve(NextResponse.json({
          success: false,
          error: `Failed to start Python email service: ${error.message}`
        }, { status: 500 }))
      })
    })

  } catch (error) {
    console.error('Error in real email test:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send real test email: ' + error.message
    }, { status: 500 })
  }
}
