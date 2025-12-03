// Test script to manually sync achievements
import { AchievementService } from "./lib/achievement-service.js"

async function testAchievements() {
  try {
    console.log("🧪 Testing Achievement Sync...")
    
    // Replace with your actual user ID
    const userId = 1 // Change this to your user ID
    
    console.log(`📊 Syncing achievements for user ${userId}...`)
    
    const newAchievements = await AchievementService.checkMealAchievements(userId)
    
    console.log(`✅ Sync completed!`)
    console.log(`🏆 Newly earned achievements: ${newAchievements.length}`)
    
    if (newAchievements.length > 0) {
      console.log("🎉 New achievements earned:")
      newAchievements.forEach(ach => {
        console.log(`  🏅 ${ach.name}: ${ach.description}`)
      })
    }
    
    console.log("\n🔍 Now check your achievements page to see updated progress!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

testAchievements()
