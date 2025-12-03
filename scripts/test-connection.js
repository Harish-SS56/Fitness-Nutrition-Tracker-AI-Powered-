import { sql } from '../lib/database.js'

async function testConnection() {
  try {
    console.log("🔗 Testing database connection...")
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`
    console.log("✅ Database connected:", result[0].current_time)
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    console.log("📋 Tables found:", tables.map(t => t.table_name))
    
    // Check nutrition data
    const nutritionCount = await sql`SELECT COUNT(*) as count FROM nutrition`
    console.log("🥗 Nutrition records:", nutritionCount[0].count)
    
    // Test user creation
    console.log("👤 Testing user creation...")
    const testUser = {
      name: "Test User " + Date.now(),
      height: 175,
      weight: 70,
      bmi: 22.9,
      bmi_category: "Normal",
      goal_type: "maintenance",
      calorie_goal: 2000,
      protein_goal: 112
    }
    
    const user = await sql`
      INSERT INTO users (name, height, weight, bmi, bmi_category, goal_type, calorie_goal, protein_goal)
      VALUES (${testUser.name}, ${testUser.height}, ${testUser.weight}, ${testUser.bmi}, ${testUser.bmi_category}, ${testUser.goal_type}, ${testUser.calorie_goal}, ${testUser.protein_goal})
      RETURNING user_id, name
    `
    
    console.log("✅ Test user created:", user[0])
    
    // Test meal logging
    console.log("🍽️ Testing meal logging...")
    const testMeal = await sql`
      INSERT INTO meals (user_id, meal_text, calories, protein, fat, carbs, fiber)
      VALUES (${user[0].user_id}, 'Test meal', 500, 30, 20, 40, 5)
      RETURNING meal_id, meal_text
    `
    
    console.log("✅ Test meal logged:", testMeal[0])
    
    // Clean up test data
    await sql`DELETE FROM meals WHERE user_id = ${user[0].user_id}`
    await sql`DELETE FROM users WHERE user_id = ${user[0].user_id}`
    console.log("🧹 Test data cleaned up")
    
    console.log("\n🎉 All database tests passed!")
    
  } catch (error) {
    console.error("❌ Database test failed:", error)
    console.error("Error details:", error.message)
  }
}

testConnection()
