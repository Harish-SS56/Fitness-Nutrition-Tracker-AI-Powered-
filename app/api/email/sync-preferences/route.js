import { NextResponse } from "next/server"
import { sql } from "../../../../lib/database.js"

// POST /api/email/sync-preferences - Sync email preferences with Python email system
export async function POST(request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's current preferences
    const preferences = await sql`
      SELECT 
        user_id,
        daily_reminders_enabled,
        achievement_notifications_enabled,
        marketing_emails_enabled,
        reminder_time,
        timezone
      FROM email_preferences 
      WHERE user_id = ${parseInt(userId)}
    `

    if (preferences.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No email preferences found for user'
      }, { status: 404 })
    }

    const userPrefs = preferences[0]

    // Here you could trigger Python email service sync
    // For now, we'll just log the sync action
    console.log(`📧 Email preferences synced for user ${userId}:`, {
      daily_reminders: userPrefs.daily_reminders_enabled,
      achievement_notifications: userPrefs.achievement_notifications_enabled,
      reminder_time: userPrefs.reminder_time
    })

    // Update sync timestamp
    await sql`
      UPDATE email_preferences 
      SET updated_at = NOW()
      WHERE user_id = ${parseInt(userId)}
    `

    return NextResponse.json({
      success: true,
      message: 'Email preferences synced successfully',
      preferences: userPrefs,
      sync_timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error syncing email preferences:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to sync email preferences'
    }, { status: 500 })
  }
}
