import { neon } from "@neondatabase/serverless"

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

console.log("[v0] Database connecting to:", DATABASE_URL.substring(0, 50) + "...")

const sql = neon(DATABASE_URL)

export { sql }

// Helper functions for database operations
export async function createUser(userData) {
  const { name, email, password_hash, height, weight, bmi, bmi_category, goal_type, calorie_goal, protein_goal } = userData

  console.log("[v0] Creating user with data:", { name, email, height, weight, goal_type })

  try {
    const result = await sql`
      INSERT INTO users (name, email, password_hash, height, weight, bmi, bmi_category, goal_type, calorie_goal, protein_goal)
      VALUES (${name}, ${email}, ${password_hash}, ${height}, ${weight}, ${bmi}, ${bmi_category}, ${goal_type}, ${calorie_goal}, ${protein_goal})
      RETURNING user_id, name, email, bmi, bmi_category, goal_type, calorie_goal, protein_goal
    `

    console.log("[v0] User created successfully:", result[0])
    return result[0]
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    throw error
  }
}

export async function getUserByEmail(email) {
  try {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error getting user by email:", error)
    throw error
  }
}

export async function updateUser(userId, userData) {
  const { name, height, weight, bmi, bmi_category, goal_type, calorie_goal, protein_goal } = userData

  console.log("[v0] Updating user:", userId, userData)

  try {
    const result = await sql`
      UPDATE users 
      SET name = ${name}, height = ${height}, weight = ${weight}, bmi = ${bmi}, 
          bmi_category = ${bmi_category}, goal_type = ${goal_type}, 
          calorie_goal = ${calorie_goal}, protein_goal = ${protein_goal}, 
          updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING user_id, name, email, bmi, bmi_category, goal_type, calorie_goal, protein_goal
    `

    console.log("[v0] User updated successfully:", result[0])
    return result[0]
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    throw error
  }
}

export async function createSession(userId) {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  try {
    await sql`
      INSERT INTO user_sessions (session_id, user_id, expires_at)
      VALUES (${sessionId}, ${userId}, ${expiresAt})
    `
    return sessionId
  } catch (error) {
    console.error("[v0] Error creating session:", error)
    throw error
  }
}

export async function getSessionUser(sessionId) {
  try {
    const result = await sql`
      SELECT u.* FROM users u
      JOIN user_sessions s ON u.user_id = s.user_id
      WHERE s.session_id = ${sessionId} AND s.expires_at > NOW()
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error getting session user:", error)
    throw error
  }
}

export async function deleteSession(sessionId) {
  try {
    await sql`DELETE FROM user_sessions WHERE session_id = ${sessionId}`
  } catch (error) {
    console.error("[v0] Error deleting session:", error)
    throw error
  }
}

export async function getUserById(userId) {
  const result = await sql`
    SELECT * FROM users WHERE user_id = ${userId}
  `

  return result[0]
}

export async function searchNutrition(foodName) {
  const result = await sql`
    SELECT * FROM nutrition 
    WHERE LOWER(name) LIKE LOWER(${"%" + foodName + "%"})
    LIMIT 10
  `

  return result
}

export async function searchNutritionWithAI(foodName) {
  console.log(`[v0] Searching nutrition for: ${foodName}`)
  
  // First try to find in database
  const dbResult = await searchNutrition(foodName)
  
  if (dbResult && dbResult.length > 0) {
    console.log(`[v0] Found ${dbResult.length} matches in database`)
    return {
      found: true,
      source: "database",
      data: dbResult
    }
  }
  
  console.log(`[v0] Food "${foodName}" not found in database, using AI calculation...`)
  
  // If not found, use AI to calculate nutrition
  try {
    const { GeminiClient } = await import('./gemini-client.js')
    const aiNutrition = await GeminiClient.calculateNutritionForUnknownFood(foodName)
    
    console.log(`[v0] AI calculated nutrition for ${foodName}:`, aiNutrition)
    
    return {
      found: true,
      source: "ai_calculated",
      data: [aiNutrition], // Return as array to match database format
      confidence: aiNutrition.confidence
    }
  } catch (error) {
    console.error(`[v0] Error calculating nutrition with AI:`, error)
    return {
      found: false,
      source: "error",
      error: error.message
    }
  }
}

export async function logMeal(mealData) {
  const { user_id, meal_text, calories, protein, fat, carbs, fiber } = mealData

  console.log("[v0] Attempting to log meal:", { user_id, meal_text, calories, protein, fat, carbs, fiber })

  const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

  try {
    const result = await sql`
      INSERT INTO meals (user_id, meal_text, calories, protein, fat, carbs, fiber, meal_date)
      VALUES (${user_id}, ${meal_text}, ${calories}, ${protein}, ${fat}, ${carbs}, ${fiber}, ${today})
      RETURNING *
    `

    console.log("[v0] Meal logged successfully:", result[0])
    return result[0]
  } catch (error) {
    console.error("[v0] Error logging meal:", error)
    throw error
  }
}

export async function getDailyMeals(userId, date) {
  const queryDate = date || new Date().toISOString().split("T")[0]

  const result = await sql`
    SELECT * FROM meals 
    WHERE user_id = ${userId} AND DATE(meal_date) = DATE(${queryDate})
    ORDER BY created_at DESC
  `

  return result
}

export async function getDailyTotals(userId, date) {
  const queryDate = date || new Date().toISOString().split("T")[0]

  console.log("[v0] Querying daily totals for user:", userId, "date:", queryDate)

  const result = await sql`
    SELECT 
      COALESCE(SUM(calories), 0) as total_calories,
      COALESCE(SUM(protein), 0) as total_protein,
      COALESCE(SUM(fat), 0) as total_fat,
      COALESCE(SUM(carbs), 0) as total_carbs,
      COALESCE(SUM(fiber), 0) as total_fiber
    FROM meals 
    WHERE user_id = ${userId} AND DATE(meal_date) = DATE(${queryDate})
  `

  console.log("[v0] Daily totals result:", result[0])

  return result[0]
}

export async function saveRecommendation(userId, recommendationText) {
  const result = await sql`
    INSERT INTO recommendations (user_id, recommendation_text)
    VALUES (${userId}, ${recommendationText})
    RETURNING *
  `

  return result[0]
}

export async function getRecommendations(userId, date) {
  const result = await sql`
    SELECT * FROM recommendations 
    WHERE user_id = ${userId} AND recommendation_date = ${date}
    ORDER BY created_at DESC
    LIMIT 5
  `

  return result
}

// Workout-related functions
export async function getAllExercises() {
  try {
    const result = await sql`
      SELECT * FROM exercises 
      ORDER BY category, name
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting exercises:", error)
    throw error
  }
}

export async function getExercisesByCategory(category) {
  try {
    const result = await sql`
      SELECT * FROM exercises 
      WHERE category = ${category}
      ORDER BY name
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting exercises by category:", error)
    throw error
  }
}

export async function getExerciseById(exerciseId) {
  try {
    const result = await sql`
      SELECT * FROM exercises 
      WHERE exercise_id = ${exerciseId}
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error getting exercise by ID:", error)
    throw error
  }
}

export async function logWorkout(workoutData) {
  const { user_id, exercise_id, duration_minutes, calories_burned, notes } = workoutData
  const today = new Date().toISOString().split("T")[0]

  console.log("[v0] Logging workout:", { user_id, exercise_id, duration_minutes, calories_burned })

  try {
    const result = await sql`
      INSERT INTO workouts (user_id, exercise_id, duration_minutes, calories_burned, workout_date, notes)
      VALUES (${user_id}, ${exercise_id}, ${duration_minutes}, ${calories_burned}, ${today}, ${notes})
      RETURNING *
    `

    console.log("[v0] Workout logged successfully:", result[0])
    return result[0]
  } catch (error) {
    console.error("[v0] Error logging workout:", error)
    throw error
  }
}

export async function getMeals(userId, date) {
  const queryDate = date || new Date().toISOString().split("T")[0]

  try {
    const result = await sql`
      SELECT * FROM meals 
      WHERE user_id = ${userId} AND meal_date = ${queryDate}
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting meals:", error)
    throw error
  }
}

export async function getDailyWorkouts(userId, date) {
  const queryDate = date || new Date().toISOString().split("T")[0]

  try {
    const result = await sql`
      SELECT w.*, e.name as exercise_name, e.category
      FROM workouts w
      JOIN exercises e ON w.exercise_id = e.exercise_id
      WHERE w.user_id = ${userId} AND DATE(w.workout_date) = DATE(${queryDate})
      ORDER BY w.created_at DESC
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting daily workouts:", error)
    throw error
  }
}

export async function getTotalCaloriesBurned(userId, date) {
  const queryDate = date || new Date().toISOString().split("T")[0]

  try {
    const result = await sql`
      SELECT COALESCE(SUM(calories_burned), 0) as total_burned
      FROM workouts
      WHERE user_id = ${userId} AND DATE(workout_date) = DATE(${queryDate})
    `
    return result[0]?.total_burned || 0
  } catch (error) {
    console.error("[v0] Error getting total calories burned:", error)
    return 0
  }
}
