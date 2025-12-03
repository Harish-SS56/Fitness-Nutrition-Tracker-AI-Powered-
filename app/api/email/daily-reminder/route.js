import { NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

// Send daily reminder emails to all users using Python service
export async function POST(request) {
  try {
    console.log("Starting Python daily reminder email process...")
    
    // Path to Python email service
    const pythonScriptPath = path.join(process.cwd(), 'python_email_service', 'email_service.py')
    
    // Execute Python script
    const result = await new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [pythonScriptPath, 'send_daily_reminders'], {
        cwd: path.join(process.cwd(), 'python_email_service')
      })
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
        console.log(`Python: ${data.toString().trim()}`)
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
        console.error(`Python Error: ${data.toString().trim()}`)
      })
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse the JSON output from Python script
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

    console.log("Python daily reminder process completed")
    return NextResponse.json(result)

  } catch (error) {
    console.error("Error in Python daily reminder process:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Failed to execute Python email service"
    }, { status: 500 })
}

// Send reminder to specific user using Python service
export async function PUT(request) {
  try {
    const { user_id, email, name, calorie_goal, protein_goal } = await request.json()

    if (!email) {
      return NextResponse.json({
        error: "Email is required"
      }, { status: 400 })
    }

    console.log(`📧 Sending individual Python reminder to user: ${email}`)

    // Path to Python email service
    const pythonScriptPath = path.join(process.cwd(), 'python_email_service', 'email_service.py')
    
    // Execute Python script for individual user
    const result = await new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        pythonScriptPath, 
        'send_reminder', 
        email, 
        name || 'Fitness Enthusiast',
        (calorie_goal || 2000).toString(),
        (protein_goal || 150).toString()
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

    console.log(`📧 Python individual reminder process completed`)
    return NextResponse.json(result)

  } catch (error) {
    console.error("📧 Error sending individual Python reminder:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
