// Test script for the complete email system
import EmailService from "./lib/email-service.js"
import emailScheduler from "./lib/email-scheduler.js"

async function testEmailSystem() {
  try {
    console.log("📧 Testing Complete Email System...")
    
    const emailService = new EmailService()
    
    // Test 1: Email service connection
    console.log("\n🔍 Test 1: Testing email service connection...")
    const connectionTest = await emailService.testConnection()
    if (connectionTest.success) {
      console.log("✅ Email service connection successful")
    } else {
      console.log("❌ Email service connection failed:", connectionTest.error)
      return
    }
    
    // Test 2: Send test daily reminder
    console.log("\n🔍 Test 2: Sending test daily reminder...")
    const testUser = {
      email: "selva.propulsion@gmail.com", // Send to yourself for testing
      name: "Test User",
      goals: {
        calorie_goal: 2000,
        protein_goal: 150
      }
    }
    
    const reminderResult = await emailService.sendDailyReminder(
      testUser.email,
      testUser.name,
      testUser.goals,
      1 // Test user ID
    )
    
    if (reminderResult.success) {
      console.log("✅ Test daily reminder sent successfully")
      console.log("📧 Message ID:", reminderResult.messageId)
      console.log("📊 Email Log ID:", reminderResult.emailLogId)
    } else {
      console.log("❌ Test daily reminder failed:", reminderResult.error)
    }
    
    // Test 3: Send test achievement notification
    console.log("\n🔍 Test 3: Sending test achievement notification...")
    const testAchievement = {
      name: "Test Achievement",
      description: "This is a test achievement notification",
      badge_icon: "Trophy",
      badge_color: "#FFD700"
    }
    
    const achievementResult = await emailService.sendAchievementNotification(
      testUser.email,
      testUser.name,
      testAchievement,
      1 // Test user ID
    )
    
    if (achievementResult.success) {
      console.log("✅ Test achievement notification sent successfully")
      console.log("📧 Message ID:", achievementResult.messageId)
      console.log("📊 Email Log ID:", achievementResult.emailLogId)
    } else {
      console.log("❌ Test achievement notification failed:", achievementResult.error)
    }
    
    // Test 4: Check email logs
    console.log("\n🔍 Test 4: Checking email logs...")
    const logs = await emailService.getUserEmailLogs(1, 10)
    console.log(`📊 Found ${logs.length} email logs for test user`)
    
    logs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.email_type} - ${log.status} - ${log.subject}`)
    })
    
    // Test 5: Check email statistics
    console.log("\n🔍 Test 5: Checking email statistics...")
    const stats = await emailService.getEmailStatistics(7)
    console.log(`📊 Email statistics for last 7 days:`)
    
    stats.forEach(stat => {
      console.log(`  ${stat.date} - ${stat.email_type}: ${stat.total_sent} sent, ${stat.total_failed} failed`)
    })
    
    // Test 6: Scheduler status
    console.log("\n🔍 Test 6: Checking scheduler status...")
    const schedulerStatus = emailScheduler.getStatus()
    console.log("📅 Scheduler Status:", schedulerStatus)
    
    // Test 7: Schedule test email (optional)
    console.log("\n🔍 Test 7: Scheduling test email in 2 minutes...")
    console.log("⏰ This will send another test email in 2 minutes")
    emailScheduler.scheduleTestEmail(2)
    
    console.log("\n🎉 Email system test completed!")
    console.log("📧 Check your email inbox for test messages")
    console.log("📊 All email activities are logged in the database")
    
  } catch (error) {
    console.error("❌ Email system test failed:", error)
  }
}

testEmailSystem()
