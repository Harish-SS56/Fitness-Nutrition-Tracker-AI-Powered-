import { NextResponse } from "next/server"

export async function GET() {
  const GEMINI_API_KEY = "AIzaSyBcvOkftC2SdJzBKSc-2s1ht1ZrhkDfz0I"
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

  try {
    console.log("[Test Gemini 2.0] Testing API...")
    console.log("[Test Gemini 2.0] API Key:", GEMINI_API_KEY.substring(0, 10) + "...")
    console.log("[Test Gemini 2.0] URL:", GEMINI_API_URL)
    
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
                text: "Write a haiku about the ocean.",
              },
            ],
          },
        ],
      }),
    })

    console.log("[Test Gemini 2.0] Response status:", response.status)
    console.log("[Test Gemini 2.0] Response headers:", Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Test Gemini 2.0] Error response:", errorText)
      return NextResponse.json({ 
        success: false, 
        error: `API Error: ${response.status}`,
        details: errorText,
        url: GEMINI_API_URL,
        apiKey: GEMINI_API_KEY.substring(0, 10) + "..."
      })
    }

    const data = await response.json()
    console.log("[Test Gemini 2.0] Full response:", JSON.stringify(data, null, 2))
    
    const text = data.candidates[0]?.content?.parts[0]?.text || "No text found"
    console.log("[Test Gemini 2.0] Extracted text:", text)
    
    return NextResponse.json({ 
      success: true, 
      response: text,
      fullData: data,
      message: "Gemini 2.0 Flash is working!",
      url: GEMINI_API_URL,
      apiKey: GEMINI_API_KEY.substring(0, 10) + "..."
    })
    
  } catch (error) {
    console.error("[Test Gemini 2.0] Network error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Network error",
      details: error.message,
      stack: error.stack
    })
  }
}
