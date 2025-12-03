import { NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

// Send achievement notification email using Python service
export async function POST(request) {
  try {
    const { user_id, email, name, achievement_name, achievement_description } = await request.json()

    if (!email || !achievement_name) {
      return NextResponse.json({
        error: "Email and achievement name are required"
      }, { status: 400 })
    }

    console.log(`📧 Sending achievement notification to: ${email}`)

    // Path to Python email service
    const pythonScriptPath = path.join(process.cwd(), 'python_email_service', 'email_service.py')
    
    // Execute Python script for achievement notification
    const result = await new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        pythonScriptPath, 
        'send_achievement', 
        email, 
        name || 'Fitness Enthusiast',
        achievement_name,
        achievement_description || 'Great job on your fitness journey!'
      ], {
        cwd: path.join(process.cwd(), 'python_email_service')
      })
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
        console.log(`🐍 Python: ${data.toString().trim()}`)
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
        console.error(`🐍 Python Error: ${data.toString().trim()}`)
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
              message: 'Python script executed successfully',
              output: stdout
            })
          }
        } else {
          reject(new Error(`Python script exited with code ${code}: ${stderr}`))
        }
      })
      
      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python script: ${error.message}`))
      })
    })

    console.log(`📧 Python achievement notification process completed`)
    return NextResponse.json(result)

  } catch (error) {
    console.error("📧 Error sending achievement notification:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
