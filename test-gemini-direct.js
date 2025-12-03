// Direct test of Gemini API
const GEMINI_API_KEY = "AIzaSyDIiVwTiWeUch9xL_7oKDHKhmp_kweiTYs"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

async function testGeminiDirect() {
  console.log("🔑 Testing Gemini API directly...")
  
  try {
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
                text: "What are 3 health benefits of eating apples? Keep it short.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      }),
    })

    console.log("Response status:", response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ API Error:", errorText)
      return
    }

    const data = await response.json()
    console.log("✅ API Response:", JSON.stringify(data, null, 2))
    
    const text = data.candidates[0]?.content?.parts[0]?.text
    console.log("✅ Extracted text:", text)
    
  } catch (error) {
    console.error("❌ Network error:", error.message)
  }
}

testGeminiDirect()
