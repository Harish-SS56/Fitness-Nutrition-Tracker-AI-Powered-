import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

// Get user achievements
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[Achievements] Fetching achievements for user:", userId)

    // Get all achievements with user progress
    const achievements = await sql`
      SELECT 
        a.achievement_id,
        a.name,
        a.description,
        a.badge_icon,
        a.badge_color,
        a.category,
        a.target_value,
        a.target_unit,
        COALESCE(ua.is_earned, false) as is_earned,
        COALESCE(ua.current_progress, 0) as current_progress,
        ua.earned_at,
            CASE 
              WHEN ua.is_earned = true THEN 100
              WHEN a.achievement_type = 'daily' THEN LEAST(99, COALESCE(ua.current_progress, 0) * 100)
              WHEN a.target_value > 0 THEN LEAST(99, (COALESCE(ua.current_progress, 0) / a.target_value) * 100)
              ELSE 0
            END as progress_percentage
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ${parseInt(userId)}
      WHERE a.is_active = true
      ORDER BY 
        ua.is_earned DESC NULLS LAST,
        a.category,
        a.achievement_id
    `

    // Get recent achievements (last 7 days)
    const recentAchievements = await sql`
      SELECT 
        a.name,
        a.badge_icon,
        a.badge_color,
        ua.earned_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.achievement_id
      WHERE ua.user_id = ${parseInt(userId)} 
        AND ua.is_earned = true
        AND ua.earned_at >= NOW() - INTERVAL '7 days'
      ORDER BY ua.earned_at DESC
      LIMIT 5
    `

    // Get achievement statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_achievements,
        COUNT(CASE WHEN ua.is_earned THEN 1 END) as earned_achievements,
        COUNT(CASE WHEN a.category = 'nutrition' AND ua.is_earned THEN 1 END) as nutrition_badges,
        COUNT(CASE WHEN a.category = 'consistency' AND ua.is_earned THEN 1 END) as consistency_badges,
        COUNT(CASE WHEN a.category = 'milestone' AND ua.is_earned THEN 1 END) as milestone_badges
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ${parseInt(userId)}
      WHERE a.is_active = true
    `

    console.log(`[Achievements] Found ${achievements.length} achievements for user ${userId}`)

    return NextResponse.json({
      success: true,
      achievements: achievements,
      recent_achievements: recentAchievements,
      stats: stats[0] || {
        total_achievements: 0,
        earned_achievements: 0,
        nutrition_badges: 0,
        consistency_badges: 0,
        milestone_badges: 0
      }
    })

  } catch (error) {
    console.error("[Achievements] Error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Update achievement progress
export async function POST(request) {
  try {
    const { user_id, achievement_updates } = await request.json()

    if (!user_id || !achievement_updates) {
      return NextResponse.json({ error: "User ID and achievement updates are required" }, { status: 400 })
    }

    console.log("[Achievements] Updating progress for user:", user_id)

    const newlyEarned = []

    for (const update of achievement_updates) {
      const { achievement_id, progress_value } = update

      // Get current achievement info
      const achievement = await sql`
        SELECT a.*, ua.current_progress, ua.is_earned
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ${user_id}
        WHERE a.achievement_id = ${achievement_id}
      `

      if (achievement.length === 0) continue

      const ach = achievement[0]
      const newProgress = progress_value
      const isEarned = newProgress >= (ach.target_value || 1)

      // Update or insert user achievement
      await sql`
        INSERT INTO user_achievements (user_id, achievement_id, current_progress, is_earned, earned_at, updated_at)
        VALUES (
          ${user_id}, 
          ${achievement_id}, 
          ${newProgress}, 
          ${isEarned},
          ${isEarned ? 'NOW()' : null},
          NOW()
        )
        ON CONFLICT (user_id, achievement_id) 
        DO UPDATE SET 
          current_progress = ${newProgress},
          is_earned = ${isEarned},
          earned_at = CASE WHEN ${isEarned} AND user_achievements.is_earned = false THEN NOW() ELSE user_achievements.earned_at END,
          updated_at = NOW()
      `

      // Log progress
      await sql`
        INSERT INTO achievement_progress_log (user_id, achievement_id, progress_value)
        VALUES (${user_id}, ${achievement_id}, ${newProgress})
      `

      // Check if newly earned
      if (isEarned && !ach.is_earned) {
        newlyEarned.push({
          achievement_id,
          name: ach.name,
          description: ach.description,
          badge_icon: ach.badge_icon,
          badge_color: ach.badge_color
        })
      }
    }

    console.log(`[Achievements] Updated ${achievement_updates.length} achievements, ${newlyEarned.length} newly earned`)

    return NextResponse.json({
      success: true,
      newly_earned: newlyEarned,
      message: `Updated ${achievement_updates.length} achievements`
    })

  } catch (error) {
    console.error("[Achievements] Update error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
