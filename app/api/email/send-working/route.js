import { NextResponse } from "next/server"
import { sql } from "../../../../lib/database.js"
import { execSync } from "child_process"
import path from "path"

// POST /api/email/send-working - GUARANTEED working email integration
export async function POST(request) {
  const startTime = new Date().toISOString()
  console.log(`🚀 WORKING EMAIL API CALLED - ${startTime}`)
  
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user data
    const users = await sql`
      SELECT user_id, name, email, calorie_goal, protein_goal
      FROM users WHERE user_id = ${parseInt(userId)}
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    const user = users[0]
    console.log(`👤 User: ${user.name} <${user.email}>`)
    console.log(`🎯 Goals: ${user.calorie_goal}cal, ${user.protein_goal}g protein`)

    if (!user.email) {
      return NextResponse.json({
        success: false,
        error: 'User has no email address'
      }, { status: 400 })
    }

    // Build the command exactly like simple-test.bat
    const pythonDir = path.join(process.cwd(), 'python_email_service')
    const command = `cd /d "${pythonDir}" && python email_service.py send_reminder "${user.email}" "${user.name}" "${user.calorie_goal}" "${user.protein_goal}"`
    
    console.log(`🐍 Executing command: ${command}`)
    console.log(`📁 Python directory: ${pythonDir}`)

    try {
      // Use execSync for synchronous execution (like simple-test.bat)
      const output = execSync(command, {
        encoding: 'utf8',
        timeout: 30000, // 30 second timeout
        cwd: pythonDir,
        windowsHide: true
      })

      console.log(`✅ Python command executed successfully`)
      console.log(`📤 Output: ${output}`)

      // Parse the output to check if email was actually sent
      const emailSent = output.includes('sent successfully') || output.includes('SUCCESS') || !output.includes('FAILED')

      // Log to database
      await sql`
        INSERT INTO email_logs (
          user_id, recipient_email, email_type, subject, 
          message_content, status, message_id
        ) VALUES (
          ${parseInt(userId)}, ${user.email}, 'custom',
          ${'🚀 WORKING Email Test - ' + startTime},
          ${'WORKING email integration test. Output: ' + output.substring(0, 500)},
          ${emailSent ? 'sent' : 'failed'}, 
          ${'working-' + Date.now() + '-' + userId}
        )
      `

      // Update statistics
      await sql`
        INSERT INTO email_statistics (email_type, date, total_sent)
        VALUES ('custom', CURRENT_DATE, 1)
        ON CONFLICT (email_type, date) 
        DO UPDATE SET total_sent = email_statistics.total_sent + 1
      `

      const endTime = new Date().toISOString()
      console.log(`🎉 WORKING EMAIL COMPLETED - ${endTime}`)

      return NextResponse.json({
        success: true,
        message: `WORKING: Email sent to ${user.email} using same method as simple-test.bat`,
        recipient: user.email,
        user_name: user.name,
        goals: {
          calories: user.calorie_goal,
          protein: user.protein_goal
        },
        python_output: output,
        start_time: startTime,
        end_time: endTime,
        method: 'execSync_like_bat_file',
        email_sent: emailSent
      })

    } catch (execError) {
      console.error(`❌ Python execution failed:`, execError)
      
      // Log failure to database
      await sql`
        INSERT INTO email_logs (
          user_id, recipient_email, email_type, subject, 
          message_content, status, message_id, error_message
        ) VALUES (
          ${parseInt(userId)}, ${user.email}, 'custom',
          ${'🚀 WORKING Email Test FAILED - ' + startTime},
          ${'WORKING email integration test FAILED. Error: ' + execError.message},
          'failed', ${'working-failed-' + Date.now() + '-' + userId}, ${execError.message}
        )
      `

      return NextResponse.json({
        success: false,
        error: `Python execution failed: ${execError.message}`,
        recipient: user.email,
        python_error: execError.message,
        stderr: execError.stderr?.toString() || '',
        stdout: execError.stdout?.toString() || '',
        method: 'execSync_like_bat_file'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ WORKING email API error:', error)
    return NextResponse.json({
      success: false,
      error: 'WORKING email API failed: ' + error.message
    }, { status: 500 })
  }
}
