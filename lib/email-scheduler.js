import NativeEmailService from './native-email-service.js'

// Email scheduler for automated daily reminders (using setTimeout instead of cron)
export class EmailScheduler {
  constructor() {
    this.emailService = new NativeEmailService()
    this.isRunning = false
    this.dailyReminderTimeout = null
    this.testTimeouts = []
  }

  // Start the daily email scheduler (runs at 9:00 AM every day)
  startDailyReminders() {
    if (this.isRunning) {
      console.log('📧 Email scheduler is already running')
      return
    }

    this.scheduleNext9AM()
    this.isRunning = true
    
    console.log('📧 Daily email scheduler started - will send reminders at 9:00 AM IST every day')
  }

  // Schedule next 9 AM reminder
  scheduleNext9AM() {
    const now = new Date()
    const next9AM = new Date()
    
    // Set to 9:00 AM IST
    next9AM.setHours(9, 0, 0, 0)
    
    // If it's already past 9 AM today, schedule for tomorrow
    if (now >= next9AM) {
      next9AM.setDate(next9AM.getDate() + 1)
    }
    
    const timeUntil9AM = next9AM.getTime() - now.getTime()
    
    console.log(`📧 Next daily reminder scheduled for: ${next9AM.toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}`)
    
    this.dailyReminderTimeout = setTimeout(async () => {
      console.log('📧 Running scheduled daily reminder emails at 9:00 AM...')
      await this.sendDailyRemindersToAllUsers()
      
      // Schedule next day's reminder
      this.scheduleNext9AM()
    }, timeUntil9AM)
  }

  // Stop the scheduler
  stopDailyReminders() {
    if (this.dailyReminderTimeout) {
      clearTimeout(this.dailyReminderTimeout)
      this.dailyReminderTimeout = null
      this.isRunning = false
      console.log('📧 Daily email scheduler stopped')
    }
    
    // Clear any test timeouts
    this.testTimeouts.forEach(timeout => clearTimeout(timeout))
    this.testTimeouts = []
  }

  // Send daily reminders to all users (called by cron job)
  async sendDailyRemindersToAllUsers() {
    try {
      console.log('📧 Starting automated daily reminder process...')
      
      // Call the daily reminder API endpoint
      const response = await fetch('http://localhost:3000/api/email/daily-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EmailScheduler/1.0'
        }
      })

      const result = await response.json()
      
      if (result.success) {
        console.log(`📧 Automated daily reminders completed: ${result.sent_count} sent, ${result.failed_count} failed`)
      } else {
        console.error('📧 Automated daily reminders failed:', result.error)
      }

      return result

    } catch (error) {
      console.error('📧 Error in automated daily reminder process:', error)
      return { success: false, error: error.message }
    }
  }

  // Schedule a test email (for testing purposes)
  scheduleTestEmail(delayMinutes = 1) {
    console.log(`📧 Scheduling test email in ${delayMinutes} minute(s)...`)
    
    const delayMs = delayMinutes * 60 * 1000
    
    const testTimeout = setTimeout(async () => {
      console.log('📧 Running test email...')
      await this.sendDailyRemindersToAllUsers()
    }, delayMs)
    
    this.testTimeouts.push(testTimeout)
    return testTimeout
  }

  // Schedule email for specific time today
  scheduleSpecificTime(hour, minute) {
    console.log(`📧 Scheduling test email for ${hour}:${minute} IST today...`)
    
    const now = new Date()
    const targetTime = new Date()
    targetTime.setHours(hour, minute, 0, 0)
    
    // If the time has already passed today, schedule for tomorrow
    if (now >= targetTime) {
      targetTime.setDate(targetTime.getDate() + 1)
    }
    
    const timeUntilTarget = targetTime.getTime() - now.getTime()
    
    console.log(`📧 Test email will be sent at: ${targetTime.toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}`)
    
    const specificTimeout = setTimeout(async () => {
      console.log(`📧 Running scheduled test email at ${hour}:${minute}...`)
      await this.sendDailyRemindersToAllUsers()
    }, timeUntilTarget)
    
    this.testTimeouts.push(specificTimeout)
    return specificTimeout
  }

  // Get scheduler status
  getStatus() {
    const next9AM = new Date()
    next9AM.setHours(9, 0, 0, 0)
    if (new Date() >= next9AM) {
      next9AM.setDate(next9AM.getDate() + 1)
    }
    
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? next9AM.toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}) : null,
      timezone: 'Asia/Kolkata',
      schedule: '9:00 AM daily',
      activeTestJobs: this.testTimeouts.length
    }
  }

  // Manual trigger for testing
  async triggerManualReminder() {
    console.log('📧 Manually triggering daily reminders...')
    return await this.sendDailyRemindersToAllUsers()
  }
}

// Create singleton instance
const emailScheduler = new EmailScheduler()

export default emailScheduler
