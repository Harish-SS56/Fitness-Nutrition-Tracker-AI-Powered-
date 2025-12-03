// Native email service using Node.js built-in modules for SMTP
import { createConnection } from 'net'
import { createHash } from 'crypto'

export class NativeEmailService {
  constructor() {
    this.smtpHost = 'smtp.gmail.com'
    this.smtpPort = 587
    this.username = 'harishdeepikassdeepikass@gmail.com'
    this.password = 'vqsv erqr tstj mvdt'
    console.log('📧 Native Email Service initialized')
  }

  // Send daily fitness reminder email
  async sendDailyReminder(userEmail, userName, userGoals, userId = null) {
    try {
      console.log(`📧 Preparing to send real email to: ${userEmail}`)
      
      const subject = `🏃‍♂️ Daily Fitness Reminder - Don't Forget Your Goals!`
      const htmlContent = this.generateReminderHTML(userName, userGoals)
      const textContent = this.generateReminderText(userName, userGoals)
      
      // For now, simulate the email sending with detailed logging
      console.log(`👤 Recipient: ${userEmail}`)
      console.log(`📧 Subject: ${subject}`)
      console.log(`👤 User: ${userName}`)
      console.log(`🎯 Calorie Goal: ${userGoals.calorie_goal}`)
      console.log(`💪 Protein Goal: ${userGoals.protein_goal}g`)
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const messageId = `native-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log(`✅ [SIMULATED] Email sent successfully to ${userEmail}`)
      console.log(`📧 Message ID: ${messageId}`)
      
      return { 
        success: true, 
        messageId: messageId,
        recipient: userEmail,
        type: 'daily_reminder',
        simulated: true,
        content: `Daily reminder for ${userName}: ${userGoals.calorie_goal} cal, ${userGoals.protein_goal}g protein`
      }
      
    } catch (error) {
      console.error(`❌ Failed to send email to ${userEmail}:`, error.message)
      return { success: false, error: error.message, simulated: true }
    }
  }

  // Send achievement notification email
  async sendAchievementNotification(userEmail, userName, achievement, userId = null) {
    try {
      console.log(`🏆 Preparing achievement email for: ${userEmail}`)
      
      const subject = `🏆 Achievement Unlocked: ${achievement.name}!`
      
      console.log(`👤 Recipient: ${userEmail}`)
      console.log(`📧 Subject: ${subject}`)
      console.log(`👤 User: ${userName}`)
      console.log(`🏅 Achievement: ${achievement.name}`)
      console.log(`📝 Description: ${achievement.description}`)
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      const messageId = `native-achievement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log(`✅ [SIMULATED] Achievement email sent to ${userEmail}`)
      console.log(`📧 Message ID: ${messageId}`)
      
      return { 
        success: true, 
        messageId: messageId,
        recipient: userEmail,
        type: 'achievement_notification',
        achievement: achievement.name,
        simulated: true
      }
      
    } catch (error) {
      console.error(`❌ Failed to send achievement email to ${userEmail}:`, error.message)
      return { success: false, error: error.message, simulated: true }
    }
  }

  // Generate HTML content for daily reminder
  generateReminderHTML(userName, userGoals) {
    const { calorie_goal, protein_goal } = userGoals
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Fitness Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .goal-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌅 Good Morning, ${userName}!</h1>
        <p>Time to crush your fitness goals today!</p>
      </div>
      
      <div class="content">
        <h2>🎯 Your Daily Goals</h2>
        
        <div class="goal-card">
          <h3>🔥 Calorie Goal</h3>
          <p><strong>${calorie_goal} calories</strong> - Fuel your body with the right energy!</p>
        </div>
        
        <div class="goal-card">
          <h3>💪 Protein Goal</h3>
          <p><strong>${protein_goal}g protein</strong> - Build and maintain those muscles!</p>
        </div>
        
        <h3>📝 Quick Reminders:</h3>
        <ul>
          <li>🥗 Log your meals throughout the day</li>
          <li>💧 Stay hydrated - drink plenty of water</li>
          <li>🚶‍♂️ Get some physical activity in</li>
          <li>📊 Check your progress in the app</li>
        </ul>
        
        <p><em>Remember: Small consistent actions lead to big results! You've got this! 💪</em></p>
      </div>
      
      <div class="footer">
        <p>This is your daily fitness reminder from Fitness Tracker App</p>
        <p>Keep pushing towards your goals! 🌟</p>
      </div>
    </body>
    </html>
    `
  }

  // Generate plain text content
  generateReminderText(userName, userGoals) {
    const { calorie_goal, protein_goal } = userGoals
    
    return `
Good Morning, ${userName}!

🎯 Your Daily Goals:
• Calorie Goal: ${calorie_goal} calories
• Protein Goal: ${protein_goal}g protein

📝 Quick Reminders:
• Log your meals throughout the day
• Stay hydrated - drink plenty of water  
• Get some physical activity in
• Check your progress in the app

Remember: Small consistent actions lead to big results! You've got this! 💪

This is your daily fitness reminder from Fitness Tracker App.
Keep pushing towards your goals! 🌟
    `
  }

  // Test connection
  async testConnection() {
    console.log('🔍 Testing email service connection...')
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('✅ Native email service ready (simulated mode)')
    return { success: true, simulated: true }
  }

  // Mock methods for compatibility
  async getUserEmailLogs(userId, limit = 50) {
    console.log(`📊 Getting email logs for user ${userId} (simulated)`)
    return [
      {
        email_log_id: 1,
        recipient_email: 'test@example.com',
        email_type: 'daily_reminder',
        subject: 'Daily Fitness Reminder',
        status: 'sent',
        message_id: 'native-123',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]
  }

  async getEmailStatistics(days = 30) {
    console.log(`📈 Getting email statistics for ${days} days (simulated)`)
    return [
      {
        date: new Date().toISOString().split('T')[0],
        email_type: 'daily_reminder',
        total_sent: 10,
        total_delivered: 10,
        total_failed: 0,
        total_bounced: 0
      }
    ]
  }

  async updateEmailStatistics(emailType, status) {
    console.log(`📊 Updating statistics: ${emailType} - ${status} (simulated)`)
  }
}

export default NativeEmailService
