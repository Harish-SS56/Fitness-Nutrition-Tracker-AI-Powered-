import { NextResponse } from "next/server"

export async function GET() {
  const GEMINI_API_KEY = "AIzaSyCCo_ULFaD2KiSJGGmaOfEPeDgGrY-WhL4"
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

  try {
    console.log("[Test] Testing Gemini API...")
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Say 'Hello' in one word.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
        },
      }),
    })

    console.log("[Test] Response status:", response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log("[Test] Error response:", errorText)
      return NextResponse.json({ 
        success: false, 
        error: `API Error: ${response.status}`,
        details: errorText 
      })
    }

    const data = await response.json()
    const text = data.candidates[0]?.content?.parts[0]?.text || "No response"
    
    console.log("[Test] Success! Response:", text)
    
    return NextResponse.json({ 
      success: true, 
      response: text,
      status: response.status,
      message: "Gemini API is working!"
    })
    
  } catch (error) {
    console.error("[Test] Network error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Network error",
      details: error.message 
    })
  }
}
