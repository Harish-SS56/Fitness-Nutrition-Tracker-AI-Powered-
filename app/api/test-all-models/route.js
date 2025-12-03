import { NextResponse } from "next/server"

export async function GET() {
  const GEMINI_API_KEY = "AIzaSyCCo_ULFaD2KiSJGGmaOfEPeDgGrY-WhL4"
  
  const modelsToTest = [
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
  ]

  const results = []

  for (const url of modelsToTest) {
    try {
      console.log(`[Test All] Testing: ${url}`)
      
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
                  text: "Say hello in one word.",
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
          status: "✅ SUCCESS",
          response: text.trim(),
          statusCode: response.status
        })
        console.log(`[Test All] ✅ SUCCESS: ${url} - Response: ${text}`)
      } else {
        const errorText = await response.text()
        results.push({
          url,
          status: "❌ FAILED",
          error: errorText,
          statusCode: response.status
        })
        console.log(`[Test All] ❌ FAILED: ${url} - ${response.status}`)
      }
    } catch (error) {
      results.push({
        url,
        status: "❌ ERROR",
        error: error.message,
        statusCode: "Network Error"
      })
      console.log(`[Test All] ❌ ERROR: ${url} - ${error.message}`)
    }
  }

  return NextResponse.json({
    apiKey: GEMINI_API_KEY.substring(0, 10) + "...",
    totalTested: modelsToTest.length,
    results,
    summary: {
      successful: results.filter(r => r.status === "✅ SUCCESS").length,
      failed: results.filter(r => r.status !== "✅ SUCCESS").length
    }
  })
}
