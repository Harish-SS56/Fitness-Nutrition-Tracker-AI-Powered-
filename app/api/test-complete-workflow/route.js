import { NextResponse } from "next/server"
import { searchNutritionWithAI } from "../../../lib/database.js"
import { GeminiClient } from "../../../lib/gemini-client.js"

export async function POST(request) {
  try {
    const { test_foods } = await request.json()
    
    const testFoods = test_foods || [
      "chapathi", 
      "chicken breast", 
      "basmati rice", 
      "dal", 
      "unknown_indian_food_xyz"
    ]

    console.log("[Complete Workflow Test] Testing foods:", testFoods)

    const results = []
    
    // Test 1: Individual nutrition search with AI fallback
    console.log("\n=== TEST 1: Nutrition Search with AI Fallback ===")
    for (const food of testFoods) {
      console.log(`\nTesting: ${food}`)
      
      const searchResult = await searchNutritionWithAI(food)
      
      results.push({
        test: "nutrition_search",
        food,
        ...searchResult,
        timestamp: new Date().toISOString()
      })
      
      console.log(`Result: ${searchResult.found ? '✅' : '❌'} ${searchResult.source || 'error'}`)
    }

    // Test 2: Complete meal parsing workflow
    console.log("\n=== TEST 2: Complete Meal Parsing Workflow ===")
    const testMeal = "2 chapathi with 1 cup dal and 100g chicken breast"
    console.log(`Testing meal: "${testMeal}"`)
    
    try {
      const parsedMeal = await GeminiClient.parseMealText(testMeal)
      console.log("Parsed items:", parsedMeal.items?.length || 0)
      
      // Process each item through nutrition search
      const mealResults = []
      let totalCalories = 0
      let totalProtein = 0
      
      for (const item of parsedMeal.items || []) {
        const nutritionSearch = await searchNutritionWithAI(item.name)
        
        if (nutritionSearch.found && nutritionSearch.data.length > 0) {
          const nutrition = nutritionSearch.data[0]
          const multiplier = item.quantity_g / 100
          
          const itemNutrition = {
            calories: (nutrition.enerc || 0) * multiplier,
            protein: (nutrition.protcnt || 0) * multiplier
          }
          
          totalCalories += itemNutrition.calories
          totalProtein += itemNutrition.protein
          
          mealResults.push({
            ...item,
            nutrition: itemNutrition,
            source: nutritionSearch.source,
            found: true
          })
        } else {
          mealResults.push({
            ...item,
            nutrition: null,
            source: "error",
            found: false
          })
        }
      }
      
      results.push({
        test: "meal_parsing_workflow",
        meal_text: testMeal,
        parsed_items: parsedMeal.items?.length || 0,
        processed_items: mealResults.length,
        total_calories: Math.round(totalCalories * 10) / 10,
        total_protein: Math.round(totalProtein * 10) / 10,
        items: mealResults,
        success: true,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ Meal parsing successful: ${totalCalories.toFixed(0)} cal, ${totalProtein.toFixed(1)}g protein`)
      
    } catch (error) {
      console.log(`❌ Meal parsing failed: ${error.message}`)
      results.push({
        test: "meal_parsing_workflow",
        meal_text: testMeal,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }

    // Test 3: AI Chat functionality
    console.log("\n=== TEST 3: AI Chat Functionality ===")
    try {
      const chatResponse = await GeminiClient.generateContent(
        "What are the health benefits of chapathi? Give a brief answer."
      )
      
      results.push({
        test: "ai_chat",
        question: "What are the health benefits of chapathi?",
        response: chatResponse.substring(0, 200) + "...",
        response_length: chatResponse.length,
        success: true,
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ AI Chat successful: ${chatResponse.length} characters`)
      
    } catch (error) {
      console.log(`❌ AI Chat failed: ${error.message}`)
      results.push({
        test: "ai_chat",
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }

    // Generate summary
    const summary = {
      total_tests: results.length,
      successful_tests: results.filter(r => r.success !== false && r.found !== false).length,
      failed_tests: results.filter(r => r.success === false || r.found === false).length,
      nutrition_searches: results.filter(r => r.test === "nutrition_search").length,
      ai_calculated_foods: results.filter(r => r.source === "ai_calculated").length,
      database_foods: results.filter(r => r.source === "database").length,
      workflow_complete: results.some(r => r.test === "meal_parsing_workflow" && r.success),
      ai_chat_working: results.some(r => r.test === "ai_chat" && r.success)
    }

    console.log("\n=== WORKFLOW TEST SUMMARY ===")
    console.log(`Total Tests: ${summary.total_tests}`)
    console.log(`Successful: ${summary.successful_tests}`)
    console.log(`Failed: ${summary.failed_tests}`)
    console.log(`AI Calculated Foods: ${summary.ai_calculated_foods}`)
    console.log(`Database Foods: ${summary.database_foods}`)
    console.log(`Meal Workflow: ${summary.workflow_complete ? '✅' : '❌'}`)
    console.log(`AI Chat: ${summary.ai_chat_working ? '✅' : '❌'}`)

    return NextResponse.json({
      success: true,
      message: "Complete nutrition workflow test completed",
      summary,
      detailed_results: results,
      recommendations: [
        summary.workflow_complete ? "✅ Meal logging workflow is functional" : "❌ Meal logging needs attention",
        summary.ai_chat_working ? "✅ AI assistant is working" : "❌ AI assistant needs fixing",
        summary.ai_calculated_foods > 0 ? "✅ AI nutrition calculation is working" : "❌ AI nutrition calculation failed",
        summary.database_foods > 0 ? "✅ Database nutrition lookup is working" : "⚠️ No database foods found in test"
      ]
    })
    
  } catch (error) {
    console.error("[Complete Workflow Test] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Workflow test failed"
    }, { status: 500 })
  }
}
