import { NextResponse } from "next/server"

export async function GET() {
  const GEMINI_API_KEY = "AQ.Ab8RN6K_jq9b8t9GyW3Y5CgGRmFai0udRV52k7jTuRFE0wSKzQ"
  
  const flashVariants = [
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent", 
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
  ]

  const results = []

  for (const url of flashVariants) {
    try {
      console.log(`[Flash Test] Testing: ${url}`)
      
      const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Hello",
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

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates[0]?.content?.parts[0]?.text || "No response"
        results.push({
          url,
          status: "✅ SUCCESS - THIS ONE WORKS!",
          response: text.trim(),
          statusCode: response.status
        })
        console.log(`[Flash Test] ✅ SUCCESS: ${url}`)
      } else {
        const errorText = await response.text()
        results.push({
          url,
          status: `❌ FAILED (${response.status})`,
          error: errorText.substring(0, 200),
          statusCode: response.status
        })
      }
    } catch (error) {
      results.push({
        url,
        status: "❌ ERROR",
        error: error.message,
        statusCode: "Network Error"
      })
    }
  }

  const working = results.find(r => r.status.includes("SUCCESS"))

  return NextResponse.json({
    message: "Testing all Gemini 1.5 Flash variants",
    workingEndpoint: working ? working.url : "NONE FOUND",
    results,
    summary: {
      total: flashVariants.length,
      working: results.filter(r => r.status.includes("SUCCESS")).length
    }
  })
}
