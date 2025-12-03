import { NextResponse } from "next/server"
import { sql } from "../../../../lib/database.js"

// POST /api/email/test-send - Send test email to user
export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, emailType = 'daily_reminder' } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user data for personalized email
    const users = await sql`
      SELECT 
        user_id,
        name,
        email,
        calorie_goal,
        protein_goal
      FROM users 
      WHERE user_id = ${parseInt(userId)}
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    const user = users[0]

    if (!user.email) {
      return NextResponse.json({
        success: false,
        error: 'User has no email address'
      }, { status: 400 })
    }

    // Check email preferences
    const preferences = await sql`
      SELECT daily_reminders_enabled, achievement_notifications_enabled
      FROM email_preferences 
      WHERE user_id = ${parseInt(userId)}
    `

    const userPrefs = preferences.length > 0 ? preferences[0] : { 
      daily_reminders_enabled: true, 
      achievement_notifications_enabled: true 
    }

    // Check if user has email enabled for this type
    if (emailType === 'daily_reminder' && !userPrefs.daily_reminders_enabled) {
      return NextResponse.json({
        success: false,
        error: 'Daily reminders are disabled for this user'
      }, { status: 400 })
    }

    if (emailType === 'achievement_notification' && !userPrefs.achievement_notifications_enabled) {
      return NextResponse.json({
        success: false,
        error: 'Achievement notifications are disabled for this user'
      }, { status: 400 })
    }

    // Log the test email attempt (use 'custom' type for test emails)
    const logResult = await sql`
      INSERT INTO email_logs (
        user_id, 
        recipient_email, 
        email_type, 
        subject, 
        message_content, 
        status,
        message_id
      )
      VALUES (
        ${parseInt(userId)},
        ${user.email},
        'custom',
        ${'🧪 Test Email - ' + (emailType === 'daily_reminder' ? 'Daily Fitness Reminder' : 'Achievement Notification')},
        ${'This is a test email sent from your fitness tracker settings. Your goals: ' + user.calorie_goal + ' calories, ' + user.protein_goal + 'g protein.'},
        'sent',
        ${'test-' + Date.now() + '-' + userId}
      )
      RETURNING email_log_id
    `

    // This is a simulation - logs to database only
    console.log(`📧 Test email simulation logged for: ${user.email}`)
    console.log(`   Type: ${emailType}`)
    console.log(`   User: ${user.name}`)
    console.log(`   Goals: ${user.calorie_goal}cal, ${user.protein_goal}g protein`)
    console.log(`   Status: Logged to database (not actually sent)`)

    // Update email statistics (use 'custom' type for test emails)
    await sql`
      INSERT INTO email_statistics (email_type, date, total_sent)
      VALUES ('custom', CURRENT_DATE, 1)
      ON CONFLICT (email_type, date) 
      DO UPDATE SET 
        total_sent = email_statistics.total_sent + 1,
        updated_at = NOW()
    `

    return NextResponse.json({
      success: true,
      message: `Test ${emailType} logged successfully for ${user.email} (simulation only)`,
      email_log_id: logResult[0].email_log_id,
      recipient: user.email,
      user_name: user.name,
      goals: {
        calories: user.calorie_goal,
        protein: user.protein_goal
      },
      type: 'simulation'
    })

  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email'
    }, { status: 500 })
  }
}
