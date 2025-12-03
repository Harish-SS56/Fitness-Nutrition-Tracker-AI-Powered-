import { sql } from "./database.js"

// Advanced nutrition search with fuzzy matching
export async function searchNutritionAdvanced(query) {
  const searchTerm = query.toLowerCase().trim()

  // First try exact match
  let results = await sql`
    SELECT * FROM nutrition 
    WHERE LOWER(name) = ${searchTerm}
    LIMIT 5
  `

  // If no exact match, try partial match
  if (results.length === 0) {
    results = await sql`
      SELECT * FROM nutrition 
      WHERE LOWER(name) LIKE ${`%${searchTerm}%`}
      ORDER BY 
        CASE 
          WHEN LOWER(name) LIKE ${`${searchTerm}%`} THEN 1
          WHEN LOWER(name) LIKE ${`%${searchTerm}%`} THEN 2
          ELSE 3
        END,
        LENGTH(name)
      LIMIT 10
    `
  }

  return results
}

// Calculate nutrition for a given quantity
export function calculateNutrition(foodItem, quantityGrams) {
  const multiplier = quantityGrams / 100 // All values are per 100g

  return {
    name: foodItem.name,
    quantity: quantityGrams,
    calories: Math.round((foodItem.enerc || 0) * multiplier * 10) / 10,
    protein: Math.round((foodItem.protcnt || 0) * multiplier * 10) / 10,
    fat: Math.round((foodItem.fatce || 0) * multiplier * 10) / 10,
    carbs: Math.round((foodItem.choavldf || 0) * multiplier * 10) / 10,
    fiber: Math.round((foodItem.fibtg || 0) * multiplier * 10) / 10,
    water: Math.round((foodItem.water || 0) * multiplier * 10) / 10,
  }
}

// Get nutrition stats for the database
export async function getNutritionStats() {
  const stats = await sql`
    SELECT 
      COUNT(*) as total_foods,
      AVG(enerc) as avg_calories,
      AVG(protcnt) as avg_protein,
      MAX(enerc) as max_calories,
      MIN(enerc) as min_calories
    FROM nutrition
    WHERE enerc > 0
  `

  return stats[0]
}

// Get top foods by nutrient
export async function getTopFoodsByNutrient(nutrient = "protcnt", limit = 10) {
  const validNutrients = ["enerc", "protcnt", "fatce", "choavldf", "fibtg"]

  if (!validNutrients.includes(nutrient)) {
    throw new Error("Invalid nutrient type")
  }

  const results = await sql`
    SELECT name, enerc, protcnt, fatce, choavldf, fibtg
    FROM nutrition 
    WHERE ${sql.unsafe(nutrient)} > 0
    ORDER BY ${sql.unsafe(nutrient)} DESC
    LIMIT ${limit}
  `

  return results
}
