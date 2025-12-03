// Test Gemini AI functionality
import { GeminiClient } from "./lib/gemini-client.js"

async function testAI() {
  console.log("🤖 Testing Gemini AI...")
  
  try {
    // Test basic content generation
    console.log("\n1. Testing basic content generation...")
    const response = await GeminiClient.generateContent("What are the health benefits of eating apples?")
    console.log("✅ Basic AI response:", response.substring(0, 100) + "...")
    
    // Test meal parsing
    console.log("\n2. Testing meal parsing...")
    const mealData = await GeminiClient.parseMealText("I ate 200g chicken breast and 1 cup rice")
    console.log("✅ Meal parsing result:", JSON.stringify(mealData, null, 2))
    
    // Test recommendations
    console.log("\n3. Testing recommendations...")
    const mockUser = {
      goal_type: "gain",
      calorie_goal: 2500,
      protein_goal: 150
    }
    const mockTotals = {
      total_calories: 1800,
      total_protein: 100
    }
    const mockFoods = [
      { name: "chicken breast", enerc: 165, protcnt: 31 },
      { name: "rice", enerc: 130, protcnt: 2.7 }
    ]
    
    const recommendations = await GeminiClient.generateNutritionRecommendations(mockUser, mockTotals, mockFoods)
    console.log("✅ Recommendations:", recommendations)
    
    console.log("\n🎉 All AI tests passed!")
    
  } catch (error) {
    console.error("❌ AI test failed:", error.message)
    console.error("Full error:", error)
  }
}

testAI()
