import { NextResponse } from "next/server"
import { sql } from "../../../../lib/database.js"

// GET /api/email/preferences - Get user's email preferences
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's email preferences
    const preferences = await sql`
      SELECT 
        user_id,
        daily_reminders_enabled,
        achievement_notifications_enabled,
        marketing_emails_enabled,
        reminder_time,
        timezone,
        created_at,
        updated_at
      FROM email_preferences 
      WHERE user_id = ${parseInt(userId)}
    `

    if (preferences.length === 0) {
      // Create default preferences if none exist
      const defaultPrefs = await sql`
        INSERT INTO email_preferences (
          user_id, 
          daily_reminders_enabled, 
          achievement_notifications_enabled, 
          marketing_emails_enabled,
          reminder_time,
          timezone
        )
        VALUES (${parseInt(userId)}, true, true, false, '09:00:00', 'UTC')
        RETURNING *
      `
      
      return NextResponse.json({
        success: true,
        preferences: defaultPrefs[0]
      })
    }

    return NextResponse.json({
      success: true,
      preferences: preferences[0]
    })

  } catch (error) {
    console.error('Error fetching email preferences:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch email preferences'
    }, { status: 500 })
  }
}

// PUT /api/email/preferences - Update user's email preferences
export async function PUT(request) {
  try {
    const body = await request.json()
    const { 
      userId, 
      daily_reminders_enabled, 
      achievement_notifications_enabled, 
      marketing_emails_enabled,
      reminder_time,
      timezone 
    } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Update email preferences
    const updatedPrefs = await sql`
      INSERT INTO email_preferences (
        user_id,
        daily_reminders_enabled,
        achievement_notifications_enabled,
        marketing_emails_enabled,
        reminder_time,
        timezone,
        updated_at
      )
      VALUES (
        ${parseInt(userId)},
        ${daily_reminders_enabled},
        ${achievement_notifications_enabled},
        ${marketing_emails_enabled || false},
        ${reminder_time || '09:00:00'},
        ${timezone || 'UTC'},
        NOW()
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        daily_reminders_enabled = EXCLUDED.daily_reminders_enabled,
        achievement_notifications_enabled = EXCLUDED.achievement_notifications_enabled,
        marketing_emails_enabled = EXCLUDED.marketing_emails_enabled,
        reminder_time = EXCLUDED.reminder_time,
        timezone = EXCLUDED.timezone,
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: 'Email preferences updated successfully',
      preferences: updatedPrefs[0]
    })

  } catch (error) {
    console.error('Error updating email preferences:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update email preferences'
    }, { status: 500 })
  }
}
