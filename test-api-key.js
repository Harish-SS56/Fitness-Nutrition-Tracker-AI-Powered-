// Test Gemini API key directly
async function testApiKey() {
  const GEMINI_API_KEY = "AIzaSyDIiVwTiWeUch9xL_7oKDHKhmp_kweiTYs"
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

  console.log("🔑 Testing Gemini API Key...")
  console.log("Key:", GEMINI_API_KEY.substring(0, 10) + "...")

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

    console.log("Status:", response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log("❌ Error:", errorText)
    } else {
      const data = await response.json()
      console.log("✅ Success:", data.candidates[0]?.content?.parts[0]?.text)
    }
  } catch (error) {
    console.log("❌ Network Error:", error.message)
  }
}

testApiKey()
