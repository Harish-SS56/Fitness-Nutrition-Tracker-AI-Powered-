// Direct email service using native Node.js modules
let nodemailer
try {
  nodemailer = await import('nodemailer')
} catch (error) {
  console.log('📧 Nodemailer not available, using mock mode')
}

export class DirectEmailService {
  constructor() {
    // Your Gmail SMTP configuration
    this.transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: "harishdeepikassdeepikass@gmail.com",
        pass: "vqsv erqr tstj mvdt"
      }
    })
    console.log('📧 Direct Email Service initialized with Gmail SMTP')
  }

  // Send daily fitness reminder email
  async sendDailyReminder(userEmail, userName, userGoals, userId = null) {
    try {
      const subject = `🏃‍♂️ Daily Fitness Reminder - Don't Forget Your Goals!`
      
      const htmlContent = this.generateReminderHTML(userName, userGoals)
      const textContent = this.generateReminderText(userName, userGoals)
      
      const mailOptions = {
        from: '"Fitness Tracker App" <harishdeepikassdeepikass@gmail.com>',
        to: userEmail,
        subject: subject,
        html: htmlContent,
        text: textContent
      }

      console.log(`📧 Sending real email to: ${userEmail}`)
      const result = await this.transporter.sendMail(mailOptions)
      
      console.log(`✅ Real email sent successfully to ${userEmail}`)
      console.log(`📧 Message ID: ${result.messageId}`)
      
      return { 
        success: true, 
        messageId: result.messageId,
        recipient: userEmail,
        real: true
      }
      
    } catch (error) {
      console.error(`❌ Failed to send real email to ${userEmail}:`, error.message)
      return { success: false, error: error.message, real: true }
    }
  }

  // Send achievement notification email
  async sendAchievementNotification(userEmail, userName, achievement, userId = null) {
    try {
      const subject = `🏆 Achievement Unlocked: ${achievement.name}!`
      
      const htmlContent = this.generateAchievementHTML(userName, achievement)
      const textContent = `Congratulations ${userName}! You've earned the "${achievement.name}" achievement: ${achievement.description}`
      
      const mailOptions = {
        from: '"Fitness Tracker App" <harishdeepikassdeepikass@gmail.com>',
        to: userEmail,
        subject: subject,
        html: htmlContent,
        text: textContent
      }

      console.log(`🏆 Sending real achievement email to: ${userEmail}`)
      const result = await this.transporter.sendMail(mailOptions)
      
      console.log(`✅ Real achievement email sent to ${userEmail}`)
      console.log(`📧 Message ID: ${result.messageId}`)
      
      return { 
        success: true, 
        messageId: result.messageId,
        recipient: userEmail,
        achievement: achievement.name,
        real: true
      }
      
    } catch (error) {
      console.error(`❌ Failed to send real achievement email to ${userEmail}:`, error.message)
      return { success: false, error: error.message, real: true }
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

  // Generate achievement HTML
  generateAchievementHTML(userName, achievement) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Achievement Unlocked!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
        .achievement-badge { background: white; padding: 30px; margin: 20px 0; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Achievement Unlocked! 🎉</h1>
        <p>Congratulations, ${userName}!</p>
      </div>
      
      <div class="content">
        <div class="achievement-badge">
          <div style="font-size: 60px; margin-bottom: 15px;">🏆</div>
          <h2>${achievement.name}</h2>
          <p style="font-size: 18px; color: #666;">${achievement.description}</p>
        </div>
        
        <p><strong>You're doing amazing! Keep up the great work!</strong></p>
        <p><em>Every achievement brings you closer to your fitness goals! 💪</em></p>
      </div>
    </body>
    </html>
    `
  }

  // Test connection
  async testConnection() {
    try {
      await this.transporter.verify()
      console.log('✅ Real email connection verified')
      return { success: true, real: true }
    } catch (error) {
      console.error('❌ Real email connection failed:', error.message)
      return { success: false, error: error.message, real: true }
    }
  }
}

export default DirectEmailService
