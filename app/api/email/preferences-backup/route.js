import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Direct database connection as backup
const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

// GET /api/email/preferences-backup - Get user's email preferences (backup route)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log(`📧 Fetching email preferences for user: ${userId}`)

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
      console.log(`📧 No preferences found for user ${userId}, creating defaults`)
      
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
        preferences: defaultPrefs[0],
        message: 'Default preferences created'
      })
    }

    console.log(`📧 Found preferences for user ${userId}:`, preferences[0])

    return NextResponse.json({
      success: true,
      preferences: preferences[0]
    })

  } catch (error) {
    console.error('❌ Error fetching email preferences:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch email preferences: ' + error.message
    }, { status: 500 })
  }
}

// PUT /api/email/preferences-backup - Update user's email preferences (backup route)
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

    console.log(`📧 Updating email preferences for user: ${userId}`, {
      daily_reminders_enabled,
      achievement_notifications_enabled,
      reminder_time
    })

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

    console.log(`✅ Email preferences updated for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Email preferences updated successfully',
      preferences: updatedPrefs[0]
    })

  } catch (error) {
    console.error('❌ Error updating email preferences:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update email preferences: ' + error.message
    }, { status: 500 })
  }
}
