// Simple email service for testing without external dependencies
export class SimpleEmailService {
  constructor() {
    console.log('📧 Simple Email Service initialized (mock mode)')
  }

  // Mock send daily reminder
  async sendDailyReminder(userEmail, userName, userGoals, userId = null) {
    try {
      console.log(`📧 [MOCK] Sending daily reminder to: ${userEmail}`)
      console.log(`👤 User: ${userName}`)
      console.log(`🎯 Goals: ${userGoals.calorie_goal} calories, ${userGoals.protein_goal}g protein`)
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockMessageId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log(`✅ [MOCK] Daily reminder sent successfully`)
      console.log(`📧 Mock Message ID: ${mockMessageId}`)
      
      return { 
        success: true, 
        messageId: mockMessageId,
        mock: true,
        recipient: userEmail,
        content: `Daily reminder for ${userName}: ${userGoals.calorie_goal} cal, ${userGoals.protein_goal}g protein`
      }
      
    } catch (error) {
      console.error(`❌ [MOCK] Failed to send daily reminder:`, error)
      return { success: false, error: error.message, mock: true }
    }
  }

  // Mock send achievement notification
  async sendAchievementNotification(userEmail, userName, achievement, userId = null) {
    try {
      console.log(`🏆 [MOCK] Sending achievement notification to: ${userEmail}`)
      console.log(`👤 User: ${userName}`)
      console.log(`🏅 Achievement: ${achievement.name}`)
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockMessageId = `mock-achievement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log(`✅ [MOCK] Achievement notification sent successfully`)
      console.log(`📧 Mock Message ID: ${mockMessageId}`)
      
      return { 
        success: true, 
        messageId: mockMessageId,
        mock: true,
        recipient: userEmail,
        achievement: achievement.name
      }
      
    } catch (error) {
      console.error(`❌ [MOCK] Failed to send achievement notification:`, error)
      return { success: false, error: error.message, mock: true }
    }
  }

  // Mock test connection
  async testConnection() {
    console.log('🔍 [MOCK] Testing email connection...')
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('✅ [MOCK] Email connection test successful')
    return { success: true, mock: true }
  }

  // Mock get user email logs
  async getUserEmailLogs(userId, limit = 50) {
    console.log(`📊 [MOCK] Getting email logs for user ${userId}`)
    return [
      {
        email_log_id: 1,
        recipient_email: 'test@example.com',
        email_type: 'daily_reminder',
        subject: 'Daily Fitness Reminder',
        status: 'sent',
        message_id: 'mock-123',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]
  }

  // Mock get email statistics
  async getEmailStatistics(days = 30) {
    console.log(`📈 [MOCK] Getting email statistics for ${days} days`)
    return [
      {
        date: new Date().toISOString().split('T')[0],
        email_type: 'daily_reminder',
        total_sent: 5,
        total_delivered: 5,
        total_failed: 0,
        total_bounced: 0
      }
    ]
  }

  // Mock update email statistics
  async updateEmailStatistics(emailType, status) {
    console.log(`📊 [MOCK] Updating statistics: ${emailType} - ${status}`)
  }
}

export default SimpleEmailService
