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

    console.log(`📧 Python scheduler action: ${action}`)

    // Path to Python scheduler
    const pythonScriptPath = path.join(process.cwd(), 'python_email_service', 'email_scheduler.py')
    
    let pythonArgs = [pythonScriptPath]
    let result = {}

    switch (action) {
      case 'start':
        pythonArgs.push('start')
        break

      case 'stop':
        pythonArgs.push('stop')
        break

      case 'trigger':
        pythonArgs.push('trigger')
        break

      case 'test':
        const delayMinutes = testDelayMinutes || 1
        pythonArgs.push('test', delayMinutes.toString())
        break

      case 'schedule_specific':
        pythonArgs.push('schedule', hour.toString(), minute.toString())
        break

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action. Use 'start', 'stop', 'trigger', 'test', or 'schedule_specific'"
        }, { status: 400 })
    }

    // Execute Python script
    result = await new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', pythonArgs, {
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
              message: `Python scheduler ${action} executed successfully`,
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

    console.log(`📧 Python scheduler ${action} completed`)
    return NextResponse.json(result)

  } catch (error) {
    console.error(`📧 Error in Python scheduler:`, error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
