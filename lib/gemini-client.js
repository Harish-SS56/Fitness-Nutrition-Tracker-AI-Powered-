// Gemini AI client for meal parsing and recommendations

const GEMINI_API_KEY = "AIzaSyBcvOkftC2SdJzBKSc-2s1ht1ZrhkDfz0I"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

export class GeminiClient {
  static async generateContent(prompt) {
    try {
      console.log("[Gemini] Making API call...")
      console.log("[Gemini] API Key:", GEMINI_API_KEY.substring(0, 15) + "...")
      console.log("[Gemini] URL:", GEMINI_API_URL)
      console.log("[Gemini] Prompt length:", prompt.length)

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
                  text: prompt,
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

      console.log("[Gemini] Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[Gemini] API error response:", errorText)
        
        // Handle rate limiting with a helpful message
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.")
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[Gemini] Response data structure:", Object.keys(data))
      
      const text = data.candidates[0]?.content?.parts[0]?.text || ""
      console.log("[Gemini] Extracted text length:", text.length)
      
      return text
    } catch (error) {
      console.error("[Gemini] API error:", error)
      console.error("[Gemini] Error details:", error.message)
      throw new Error("Failed to generate AI response: " + error.message)
    }
  }

  static async calculateNutritionForUnknownFood(foodName, quantityGrams = 100) {
    const prompt = `
You are a professional nutritionist and food database expert. Calculate the accurate nutrition values for "${foodName}" per 100 grams.

Food item: "${foodName}"
Quantity: ${quantityGrams}g

Please provide accurate nutrition information based on standard food composition databases (USDA, Indian food composition tables, etc.).

Respond with ONLY a valid JSON object in this exact format:
{
  "name": "${foodName.toLowerCase()}",
  "enerc": number_calories_per_100g,
  "protcnt": number_protein_grams_per_100g,
  "fat": number_fat_grams_per_100g,
  "chocdf": number_carbs_grams_per_100g,
  "fibtg": number_fiber_grams_per_100g,
  "calculated_by_ai": true,
  "confidence": "high/medium/low"
}

Rules:
1. Use realistic, accurate values based on similar foods
2. For Indian foods like chapathi, use Indian food composition data
3. Be conservative with estimates - better to underestimate than overestimate
4. Set confidence based on how common/well-known the food is
5. Only respond with the JSON, no additional text
`

    try {
      const response = await this.generateContent(prompt)
      
      // Clean the response - remove markdown code blocks and extra text
      let cleanedResponse = response.trim()
      
      // Remove markdown code blocks if present
      if (cleanedResponse.includes('```json')) {
        cleanedResponse = cleanedResponse.split('```json')[1]
      }
      if (cleanedResponse.includes('```')) {
        cleanedResponse = cleanedResponse.split('```')[0]
      }
      
      // Remove any leading/trailing whitespace and backticks
      cleanedResponse = cleanedResponse.replace(/^`+|`+$/g, '').trim()
      
      console.log("[Gemini] Cleaned response for parsing:", cleanedResponse)
      
      const nutritionData = JSON.parse(cleanedResponse)
      
      // Validate the response has required fields
      if (!nutritionData.enerc || !nutritionData.protcnt) {
        throw new Error("Invalid nutrition data from AI")
      }
      
      return nutritionData
    } catch (error) {
      console.error("[Gemini] Error calculating nutrition:", error)
      // Return default values for unknown food
      return {
        name: foodName.toLowerCase(),
        enerc: 200, // Default calories
        protcnt: 5,  // Default protein
        fat: 3,      // Default fat
        chocdf: 35,  // Default carbs
        fibtg: 3,    // Default fiber
        calculated_by_ai: true,
        confidence: "low",
        error: "Could not calculate accurate nutrition"
      }
    }
  }

  static async parseMealText(mealText) {
    const prompt = `
You are a nutrition expert. Parse the following meal description and extract food items with their quantities.

Meal description: "${mealText}"

Please respond with ONLY a valid JSON object in this exact format:
{
  "items": [
    {
      "name": "food_name_in_lowercase",
      "quantity_g": number_in_grams
    }
  ]
}

Rules:
1. Convert all quantities to grams (1 cup rice ≈ 200g, 1 medium apple ≈ 180g, etc.)
2. Use simple, searchable food names (e.g., "chicken breast" not "grilled chicken breast")
3. If no quantity is specified, assume 100g
4. If multiple foods are mentioned, include all of them
5. Only respond with the JSON, no additional text

Examples:
- "I ate 250g chicken" → {"items": [{"name": "chicken", "quantity_g": 250}]}
- "2 cups rice and an apple" → {"items": [{"name": "rice", "quantity_g": 400}, {"name": "apple", "quantity_g": 180}]}
`

    try {
      const response = await this.generateContent(prompt)

      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No valid JSON found in AI response")
      }

      const parsedData = JSON.parse(jsonMatch[0])

      // Validate the structure
      if (!parsedData.items || !Array.isArray(parsedData.items)) {
        throw new Error("Invalid response structure from AI")
      }

      return parsedData
    } catch (error) {
      console.error("Error parsing meal with AI:", error)
      // Fallback to simple parsing
      return this.fallbackParsing(mealText)
    }
  }

  static fallbackParsing(mealText) {
    // Simple fallback parsing logic
    const patterns = [
      /(\d+)\s*(?:g|grams?|gram)\s+(.+)/gi,
      /(.+?)\s+(\d+)\s*(?:g|grams?|gram)/gi,
      /(\d+)\s*(?:cups?|cup)\s+(.+)/gi,
    ]

    const items = []
    let matched = false

    for (const pattern of patterns) {
      const matches = [...mealText.matchAll(pattern)]

      for (const match of matches) {
        let quantity, foodName

        if (pattern.source.includes("\\d+.*g")) {
          quantity = Number.parseInt(match[1])
          foodName = match[2].trim()
        } else {
          foodName = match[1].trim()
          quantity = Number.parseInt(match[2])

          if (pattern.source.includes("cups?")) {
            quantity = quantity * 200
          }
        }

        if (quantity && foodName) {
          items.push({
            name: foodName.toLowerCase(),
            quantity_g: quantity,
          })
          matched = true
        }
      }
    }

    if (!matched) {
      const cleanText = mealText.replace(/[^\w\s]/g, "").trim()
      if (cleanText) {
        items.push({
          name: cleanText.toLowerCase(),
          quantity_g: 100,
        })
      }
    }

    return { items }
  }

  static async generateNutritionRecommendations(user, dailyTotals, availableFoods) {
    const remainingCalories = Math.max(0, user.calorie_goal - dailyTotals.total_calories)
    const remainingProtein = Math.max(0, user.protein_goal - dailyTotals.total_protein)

    // Get a sample of available foods for recommendations
    const foodSample = availableFoods
      .slice(0, 20)
      .map((food) => `${food.name} (${food.enerc} cal, ${food.protcnt}g protein per 100g)`)
      .join(", ")

    const prompt = `
You are a professional nutritionist. Generate personalized nutrition recommendations for a user.

User Profile:
- Goal: ${user.goal_type}
- Daily calorie goal: ${user.calorie_goal}
- Daily protein goal: ${user.protein_goal}g

Today's Progress:
- Calories consumed: ${dailyTotals.total_calories}
- Protein consumed: ${dailyTotals.total_protein}g
- Remaining calories needed: ${remainingCalories}
- Remaining protein needed: ${remainingProtein}g

Available foods in database: ${foodSample}

Please provide 3-4 specific, actionable recommendations. Focus on:
1. Meeting remaining calorie and protein goals
2. Suggesting specific foods from the available database
3. Portion sizes and meal timing
4. Goal-specific advice (weight loss/gain/maintenance)

Keep recommendations concise, practical, and motivating. Each recommendation should be 1-2 sentences.

Format as a JSON array of strings:
["recommendation 1", "recommendation 2", "recommendation 3"]
`

    try {
      const response = await this.generateContent(prompt)

      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("No valid JSON array found in AI response")
      }

      const recommendations = JSON.parse(jsonMatch[0])

      if (!Array.isArray(recommendations)) {
        throw new Error("AI response is not an array")
      }

      return recommendations
    } catch (error) {
      console.error("Error generating AI recommendations:", error)
      return this.fallbackRecommendations(user, dailyTotals)
    }
  }

  static fallbackRecommendations(user, dailyTotals) {
    const recommendations = []
    const remainingCalories = Math.max(0, user.calorie_goal - dailyTotals.total_calories)
    const remainingProtein = Math.max(0, user.protein_goal - dailyTotals.total_protein)

    if (remainingCalories > 200) {
      if (remainingProtein > 10) {
        recommendations.push(
          `You need ${remainingCalories.toFixed(0)} more calories and ${remainingProtein.toFixed(1)}g more protein today. Try adding lean protein sources like chicken breast, fish, or Greek yogurt.`,
        )
      } else {
        recommendations.push(
          `You need ${remainingCalories.toFixed(0)} more calories today. Consider healthy options like nuts, avocado, or whole grains.`,
        )
      }
    } else if (remainingProtein > 5) {
      recommendations.push(
        `You're close to your calorie goal but need ${remainingProtein.toFixed(1)}g more protein. Try low-calorie protein sources like egg whites or lean fish.`,
      )
    } else {
      recommendations.push("Great job! You're on track with your nutrition goals today. Keep up the good work!")
    }

    if (user.goal_type === "gain") {
      recommendations.push(
        "For muscle gain, focus on protein-rich foods and don't forget healthy carbs for energy. Consider post-workout meals with both protein and carbs.",
      )
    } else if (user.goal_type === "loss") {
      recommendations.push(
        "For weight loss, prioritize protein to maintain muscle mass and include plenty of vegetables for nutrients and satiety.",
      )
    }

    return recommendations
  }
}
