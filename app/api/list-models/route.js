import { NextResponse } from "next/server"

export async function GET() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDIiVwTiWeUch9xL_7oKDHKhmp_kweiTYs"
  
  try {
    console.log("[List Models] Checking available models...")
    
    // Try to list available models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    })

    console.log("[List Models] Response status:", response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log("[List Models] Error response:", errorText)
      return NextResponse.json({ 
        success: false, 
        error: `API Error: ${response.status}`,
        details: errorText 
      })
    }

    const data = await response.json()
    console.log("[List Models] Available models:", data)
    
    // Filter for models that support generateContent
    const availableModels = data.models?.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || []
    
    return NextResponse.json({ 
      success: true, 
      models: availableModels.map(m => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description
      })),
      totalModels: availableModels.length,
      message: "Available models for generateContent"
    })
    
  } catch (error) {
    console.error("[List Models] Network error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Network error",
      details: error.message 
    })
  }
}
