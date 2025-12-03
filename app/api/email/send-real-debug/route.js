import { NextResponse } from "next/server"
import { sql } from "../../../../lib/database.js"
import { spawn } from "child_process"
import path from "path"

// POST /api/email/send-real-debug - Debug real email sending with detailed logs
export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, emailType = 'daily_reminder' } = body

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
    const currentTime = new Date().toISOString()

    console.log(`🔍 DEBUG EMAIL SEND - ${currentTime}`)
    console.log(`   User: ${user.name} (ID: ${user.user_id})`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Goals: ${user.calorie_goal}cal, ${user.protein_goal}g protein`)

    // Log the attempt to database first
    const logResult = await sql`
      INSERT INTO email_logs (
        user_id, recipient_email, email_type, subject, 
        message_content, status, message_id
      ) VALUES (
        ${parseInt(userId)}, ${user.email}, 'custom',
        ${'🧪 DEBUG Real Email Test - ' + currentTime},
        ${'DEBUG: Real email test sent at ' + currentTime + '. Goals: ' + user.calorie_goal + 'cal, ' + user.protein_goal + 'g protein.'},
        'pending', ${'debug-' + Date.now() + '-' + userId}
      ) RETURNING email_log_id
    `

    console.log(`📝 Email logged to database with ID: ${logResult[0].email_log_id}`)

    // Call Python email service with detailed logging
    const pythonServicePath = path.join(process.cwd(), 'python_email_service')
    
    return new Promise((resolve) => {
      console.log(`🐍 Starting Python email service...`)
      console.log(`   Working directory: ${pythonServicePath}`)
      console.log(`   Command: python email_service.py send_reminder "${user.email}" "${user.name}" "${user.calorie_goal}" "${user.protein_goal}"`)

      const pythonProcess = spawn('python', [
        'email_service.py', 
        'send_reminder',
        user.email,
        user.name,
        user.calorie_goal.toString(),
        user.protein_goal.toString()
      ], {
        cwd: pythonServicePath,
        stdio: 'pipe',
        shell: true
      })

      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        const text = data.toString()
        output += text
        console.log(`🐍 STDOUT: ${text.trim()}`)
      })

      pythonProcess.stderr.on('data', (data) => {
        const text = data.toString()
        errorOutput += text
        console.log(`🐍 STDERR: ${text.trim()}`)
      })

      pythonProcess.on('close', async (code) => {
        console.log(`🐍 Python process finished with exit code: ${code}`)
        
        try {
          // Update the email log with result
          if (code === 0) {
            await sql`
              UPDATE email_logs 
              SET status = 'sent', updated_at = NOW()
              WHERE email_log_id = ${logResult[0].email_log_id}
            `
            console.log(`✅ Updated email log status to 'sent'`)
          } else {
            await sql`
              UPDATE email_logs 
              SET status = 'failed', error_message = ${errorOutput}, updated_at = NOW()
              WHERE email_log_id = ${logResult[0].email_log_id}
            `
            console.log(`❌ Updated email log status to 'failed'`)
          }

          if (code === 0) {
            resolve(NextResponse.json({
              success: true,
              message: `DEBUG: Real email sent successfully to ${user.email}`,
              debug_info: {
                timestamp: currentTime,
                recipient: user.email,
                user_name: user.name,
                goals: { calories: user.calorie_goal, protein: user.protein_goal },
                python_output: output,
                python_stderr: errorOutput,
                exit_code: code,
                email_log_id: logResult[0].email_log_id,
                method: 'python_email_service'
              }
            }))
          } else {
            resolve(NextResponse.json({
              success: false,
              error: `Python email service failed with exit code: ${code}`,
              debug_info: {
                timestamp: currentTime,
                python_output: output,
                python_stderr: errorOutput,
                exit_code: code,
                email_log_id: logResult[0].email_log_id
              }
            }, { status: 500 }))
          }
        } catch (dbError) {
          console.error(`❌ Database update error: ${dbError}`)
          resolve(NextResponse.json({
            success: false,
            error: `Database update failed: ${dbError.message}`,
            debug_info: {
              timestamp: currentTime,
              python_output: output,
              python_stderr: errorOutput,
              exit_code: code,
              db_error: dbError.message
            }
          }, { status: 500 }))
        }
      })

      pythonProcess.on('error', async (error) => {
        console.error(`❌ Failed to start Python process: ${error.message}`)
        
        try {
          await sql`
            UPDATE email_logs 
            SET status = 'failed', error_message = ${error.message}, updated_at = NOW()
            WHERE email_log_id = ${logResult[0].email_log_id}
          `
        } catch (dbError) {
          console.error(`❌ Database update error: ${dbError}`)
        }

        resolve(NextResponse.json({
          success: false,
          error: `Failed to start Python email service: ${error.message}`,
          debug_info: {
            timestamp: currentTime,
            process_error: error.message,
            email_log_id: logResult[0].email_log_id
          }
        }, { status: 500 }))
      })
    })

  } catch (error) {
    console.error('❌ Debug email send error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send debug email: ' + error.message,
      debug_info: {
        timestamp: new Date().toISOString(),
        api_error: error.message
      }
    }, { status: 500 })
  }
}
