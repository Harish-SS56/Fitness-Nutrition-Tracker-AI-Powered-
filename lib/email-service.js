import nodemailer from 'nodemailer'
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

// Email service for sending daily reminders and notifications with database logging
export class EmailService {
  constructor() {
    // Create SMTP transporter using your Gmail credentials
    this.transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "harishdeepikassdeepikass@gmail.com",
        pass: "vqsv erqr tstj mvdt"
      }
    })
  }

  // Send daily fitness reminder email with database logging
  async sendDailyReminder(userEmail, userName, userGoals, userId = null) {
    let emailLogId = null
    
    try {
      const subject = `🏃‍♂️ Daily Fitness Reminder - Don't Forget Your Goals!`
      const htmlContent = this.generateReminderHTML(userName, userGoals)
      const textContent = this.generateReminderText(userName, userGoals)
      
      // Log email attempt to database
      const logResult = await sql`
        INSERT INTO email_logs (user_id, recipient_email, email_type, subject, message_content, html_content, status)
        VALUES (${userId}, ${userEmail}, 'daily_reminder', ${subject}, ${textContent}, ${htmlContent}, 'pending')
        RETURNING email_log_id
      `
      emailLogId = logResult[0].email_log_id
      
      const mailOptions = {
        from: '"Fitness Tracker App" <harishdeepikassdeepikass@gmail.com>',
        to: userEmail,
        subject: subject,
        html: htmlContent,
        text: textContent
      }

      const result = await this.transporter.sendMail(mailOptions)
      
      // Update email log with success
      await sql`
        UPDATE email_logs 
        SET status = 'sent', message_id = ${result.messageId}, sent_at = NOW(), updated_at = NOW()
        WHERE email_log_id = ${emailLogId}
      `
      
      // Update email statistics
      await this.updateEmailStatistics('daily_reminder', 'sent')
      
      console.log(`✅ Daily reminder sent to ${userEmail}:`, result.messageId)
      return { success: true, messageId: result.messageId, emailLogId }
      
    } catch (error) {
      console.error(`❌ Failed to send daily reminder to ${userEmail}:`, error)
      
      // Update email log with failure
      if (emailLogId) {
        await sql`
          UPDATE email_logs 
          SET status = 'failed', error_message = ${error.message}, updated_at = NOW()
          WHERE email_log_id = ${emailLogId}
        `
      }
      
      // Update email statistics
      await this.updateEmailStatistics('daily_reminder', 'failed')
      
      return { success: false, error: error.message, emailLogId }
    }
  }

  // Send achievement notification email with database logging
  async sendAchievementNotification(userEmail, userName, achievement, userId = null) {
    let emailLogId = null
    
    try {
      const subject = `🏆 Achievement Unlocked: ${achievement.name}!`
      const htmlContent = this.generateAchievementHTML(userName, achievement)
      const textContent = `Congratulations ${userName}! You've earned the "${achievement.name}" achievement: ${achievement.description}`
      
      // Log email attempt to database
      const logResult = await sql`
        INSERT INTO email_logs (user_id, recipient_email, email_type, subject, message_content, html_content, status)
        VALUES (${userId}, ${userEmail}, 'achievement_notification', ${subject}, ${textContent}, ${htmlContent}, 'pending')
        RETURNING email_log_id
      `
      emailLogId = logResult[0].email_log_id
      
      const mailOptions = {
        from: '"Fitness Tracker App" <harishdeepikassdeepikass@gmail.com>',
        to: userEmail,
        subject: subject,
        html: htmlContent,
        text: textContent
      }

      const result = await this.transporter.sendMail(mailOptions)
      
      // Update email log with success
      await sql`
        UPDATE email_logs 
        SET status = 'sent', message_id = ${result.messageId}, sent_at = NOW(), updated_at = NOW()
        WHERE email_log_id = ${emailLogId}
      `
      
      // Update email statistics
      await this.updateEmailStatistics('achievement_notification', 'sent')
      
      console.log(`✅ Achievement notification sent to ${userEmail}:`, result.messageId)
      return { success: true, messageId: result.messageId, emailLogId }
      
    } catch (error) {
      console.error(`❌ Failed to send achievement notification to ${userEmail}:`, error)
      
      // Update email log with failure
      if (emailLogId) {
        await sql`
          UPDATE email_logs 
          SET status = 'failed', error_message = ${error.message}, updated_at = NOW()
          WHERE email_log_id = ${emailLogId}
        `
      }
      
      // Update email statistics
      await this.updateEmailStatistics('achievement_notification', 'failed')
      
      return { success: false, error: error.message, emailLogId }
    }
  }

  // Update email statistics
  async updateEmailStatistics(emailType, status) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Insert or update statistics
      await sql`
        INSERT INTO email_statistics (date, email_type, total_sent, total_delivered, total_failed)
        VALUES (${today}, ${emailType}, 
          CASE WHEN ${status} = 'sent' THEN 1 ELSE 0 END,
          CASE WHEN ${status} = 'sent' THEN 1 ELSE 0 END,
          CASE WHEN ${status} = 'failed' THEN 1 ELSE 0 END
        )
        ON CONFLICT (date, email_type) 
        DO UPDATE SET
          total_sent = email_statistics.total_sent + CASE WHEN ${status} = 'sent' THEN 1 ELSE 0 END,
          total_delivered = email_statistics.total_delivered + CASE WHEN ${status} = 'sent' THEN 1 ELSE 0 END,
          total_failed = email_statistics.total_failed + CASE WHEN ${status} = 'failed' THEN 1 ELSE 0 END,
          updated_at = NOW()
      `
    } catch (error) {
      console.error('Error updating email statistics:', error)
    }
  }

  // Get email logs for a user
  async getUserEmailLogs(userId, limit = 50) {
    try {
      const logs = await sql`
        SELECT 
          email_log_id,
          recipient_email,
          email_type,
          subject,
          status,
          message_id,
          error_message,
          sent_at,
          created_at
        FROM email_logs 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
      return logs
    } catch (error) {
      console.error('Error getting user email logs:', error)
      return []
    }
  }

  // Get email statistics
  async getEmailStatistics(days = 30) {
    try {
      const stats = await sql`
        SELECT 
          date,
          email_type,
          total_sent,
          total_delivered,
          total_failed,
          total_bounced
        FROM email_statistics 
        WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY date DESC, email_type
      `
      return stats
    } catch (error) {
      console.error('Error getting email statistics:', error)
      return []
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Fitness Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .goal-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .emoji { font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="emoji">🏃‍♂️💪</div>
        <h1>Good Morning, ${userName}!</h1>
        <p>Time to crush your fitness goals today!</p>
      </div>
      
      <div class="content">
        <h2>🎯 Your Daily Goals</h2>
        <p>Don't forget to track your nutrition and stay on top of your fitness journey!</p>
        
        <div class="goal-card">
          <h3>🔥 Calorie Goal</h3>
          <p><strong>${calorie_goal} calories</strong> - Fuel your body with the right amount of energy!</p>
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
          <li>🏆 Earn achievement badges by meeting your goals</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3000" class="cta-button">📱 Open Fitness Tracker</a>
        </div>
        
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

  // Generate plain text content for daily reminder
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
• Earn achievement badges by meeting your goals

Remember: Small consistent actions lead to big results! You've got this! 💪

Open your Fitness Tracker: http://localhost:3000

This is your daily fitness reminder from Fitness Tracker App.
Keep pushing towards your goals! 🌟
    `
  }

  // Generate HTML content for achievement notification
  generateAchievementHTML(userName, achievement) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Achievement Unlocked!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
        .achievement-badge { background: white; padding: 30px; margin: 20px 0; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .badge-icon { font-size: 60px; margin-bottom: 15px; }
        .cta-button { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Achievement Unlocked! 🎉</h1>
        <p>Congratulations, ${userName}!</p>
      </div>
      
      <div class="content">
        <div class="achievement-badge">
          <div class="badge-icon">🏆</div>
          <h2>${achievement.name}</h2>
          <p style="font-size: 18px; color: #666;">${achievement.description}</p>
        </div>
        
        <p><strong>You're doing amazing! Keep up the great work!</strong></p>
        
        <div style="margin: 30px 0;">
          <a href="http://localhost:3000/achievements" class="cta-button">🏆 View All Achievements</a>
        </div>
        
        <p><em>Every achievement brings you closer to your fitness goals! 💪</em></p>
      </div>
      
      <div class="footer">
        <p>Fitness Tracker App - Celebrating your success!</p>
        <p>Keep pushing towards your goals! 🌟</p>
      </div>
    </body>
    </html>
    `
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify()
      console.log('✅ Email service connection verified')
      return { success: true }
    } catch (error) {
      console.error('❌ Email service connection failed:', error)
      return { success: false, error: error.message }
    }
  }
}

export default EmailService
