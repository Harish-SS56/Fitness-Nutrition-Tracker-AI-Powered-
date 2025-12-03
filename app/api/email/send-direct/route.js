import { NextResponse } from "next/server"
import { sql } from "../../../../lib/database.js"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

// POST /api/email/send-direct - Direct Python email service call
export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, emailType = 'daily_reminder' } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log(`🔧 DIRECT EMAIL INTEGRATION - User ID: ${userId}`)

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

    if (!user.email) {
      return NextResponse.json({
        success: false,
        error: 'User has no email address'
      }, { status: 400 })
    }

    console.log(`📧 Target: ${user.name} <${user.email}>`)
    console.log(`🎯 Goals: ${user.calorie_goal}cal, ${user.protein_goal}g protein`)

    // Build Python command with proper escaping
    const pythonDir = path.join(process.cwd(), 'python_email_service')
    const command = `cd /d "${pythonDir}" && python email_service.py send_reminder "${user.email}" "${user.name}" "${user.calorie_goal}" "${user.protein_goal}"`
    
    console.log(`🐍 Executing: ${command}`)
    console.log(`📁 Working dir: ${pythonDir}`)

    try {
      // Execute Python command with timeout
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        cwd: pythonDir,
        windowsHide: true
      })

      console.log(`✅ Python execution completed`)
      console.log(`📤 STDOUT: ${stdout}`)
      if (stderr) {
        console.log(`⚠️ STDERR: ${stderr}`)
      }

      // Log to database
      await sql`
        INSERT INTO email_logs (
          user_id, recipient_email, email_type, subject, 
          message_content, status, message_id
        ) VALUES (
          ${parseInt(userId)}, ${user.email}, 'custom',
          ${'🔧 Direct Python Test - ' + new Date().toISOString()},
          ${'Direct Python service test. Goals: ' + user.calorie_goal + 'cal, ' + user.protein_goal + 'g protein. Output: ' + stdout.substring(0, 500)},
          'sent', ${'direct-' + Date.now() + '-' + userId}
        )
      `

      // Update statistics
      await sql`
        INSERT INTO email_statistics (email_type, date, total_sent)
        VALUES ('custom', CURRENT_DATE, 1)
        ON CONFLICT (email_type, date) 
        DO UPDATE SET total_sent = email_statistics.total_sent + 1
      `

      return NextResponse.json({
        success: true,
        message: `Direct Python email sent to ${user.email}`,
        recipient: user.email,
        user_name: user.name,
        goals: {
          calories: user.calorie_goal,
          protein: user.protein_goal
        },
        python_stdout: stdout,
        python_stderr: stderr,
        timestamp: new Date().toISOString(),
        method: 'direct_python_exec'
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
          ${'🔧 Direct Python Test FAILED - ' + new Date().toISOString()},
          ${'Direct Python service test FAILED. Error: ' + execError.message},
          'failed', ${'direct-failed-' + Date.now() + '-' + userId}, ${execError.message}
        )
      `

      return NextResponse.json({
        success: false,
        error: `Python execution failed: ${execError.message}`,
        recipient: user.email,
        python_error: execError.message,
        timestamp: new Date().toISOString(),
        method: 'direct_python_exec'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Direct email API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Direct email API failed: ' + error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
