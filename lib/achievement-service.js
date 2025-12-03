import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

export class AchievementService {
  
  // Check and update achievements after meal logging
  static async checkMealAchievements(userId) {
    try {
      console.log("[Achievement Service] Checking meal achievements for user:", userId)

      // First ensure user achievements are initialized
      await this.initializeUserAchievements(userId)

      const today = new Date().toISOString().split('T')[0]
      
      // Get user's goals and today's progress
      const userProgress = await sql`
        SELECT 
          u.calorie_goal,
          u.protein_goal,
          COALESCE(SUM(m.calories), 0) as total_calories,
          COALESCE(SUM(m.protein), 0) as total_protein
        FROM users u
        LEFT JOIN meals m ON u.user_id = m.user_id AND m.meal_date = ${today}
        WHERE u.user_id = ${parseInt(userId)}
        GROUP BY u.user_id, u.calorie_goal, u.protein_goal
      `

      if (userProgress.length === 0) return []

      const progress = userProgress[0]
      const calorieProgress = progress.calorie_goal > 0 ? progress.total_calories / progress.calorie_goal : 0
      const proteinProgress = progress.protein_goal > 0 ? progress.total_protein / progress.protein_goal : 0

      console.log("[Achievement Service] Progress calculated:", {
        calories: `${progress.total_calories}/${progress.calorie_goal} = ${(calorieProgress * 100).toFixed(1)}%`,
        protein: `${progress.total_protein}/${progress.protein_goal} = ${(proteinProgress * 100).toFixed(1)}%`
      })

      const achievementUpdates = []

      // ALWAYS update daily achievements with current progress (allow over 100%)
      const calorieAchievementId = await this.getAchievementId('Daily Calorie Goal')
      if (calorieAchievementId) {
        achievementUpdates.push({
          achievement_id: calorieAchievementId,
          progress_value: calorieProgress // Don't cap at 1, allow over 100%
        })
      }

      const proteinAchievementId = await this.getAchievementId('Daily Protein Goal')
      if (proteinAchievementId) {
        achievementUpdates.push({
          achievement_id: proteinAchievementId,
          progress_value: proteinProgress // Don't cap at 1, allow over 100%
        })
      }

      // Balanced Day (both goals met at 80%+)
      if (calorieProgress >= 0.8 && proteinProgress >= 0.8) {
        const balancedDayId = await this.getAchievementId('Balanced Day')
        if (balancedDayId) {
          achievementUpdates.push({
            achievement_id: balancedDayId,
            progress_value: 1
          })
        }
      }

      // Check milestone achievements
      await this.checkMilestoneAchievements(userId, achievementUpdates)

      // Check streak achievements
      await this.checkStreakAchievements(userId, achievementUpdates)

      console.log("[Achievement Service] Achievement updates to process:", achievementUpdates.length)

      // Update achievements using direct database calls instead of API
      const newlyEarned = []
      
      for (const update of achievementUpdates) {
        try {
          // Get current achievement info
          const achievement = await sql`
            SELECT a.*, ua.current_progress, ua.is_earned
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ${parseInt(userId)}
            WHERE a.achievement_id = ${update.achievement_id}
          `

          if (achievement.length === 0) continue

          const ach = achievement[0]
          const newProgress = update.progress_value
          const isEarned = newProgress >= (ach.target_value || 1)

          // Update or insert user achievement
          await sql`
            INSERT INTO user_achievements (user_id, achievement_id, current_progress, is_earned, earned_at, updated_at)
            VALUES (
              ${parseInt(userId)}, 
              ${update.achievement_id}, 
              ${newProgress}, 
              ${isEarned},
              ${isEarned ? sql`NOW()` : null},
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
            VALUES (${parseInt(userId)}, ${update.achievement_id}, ${newProgress})
          `

          // Check if newly earned
          if (isEarned && !ach.is_earned) {
            const achievementData = {
              achievement_id: update.achievement_id,
              name: ach.name,
              description: ach.description,
              badge_icon: ach.badge_icon,
              badge_color: ach.badge_color
            }
            
            newlyEarned.push(achievementData)
            
            // Send achievement notification email
            try {
              await this.sendAchievementEmail(userId, achievementData)
            } catch (emailError) {
              console.error(`[Achievement Service] Failed to send achievement email:`, emailError)
            }
          }

          console.log(`[Achievement Service] Updated ${ach.name}: ${(newProgress * 100).toFixed(1)}% ${isEarned ? '(EARNED!)' : ''}`)
        } catch (updateError) {
          console.error(`[Achievement Service] Error updating achievement ${update.achievement_id}:`, updateError)
        }
      }

      console.log(`[Achievement Service] Completed: ${achievementUpdates.length} updated, ${newlyEarned.length} newly earned`)
      return newlyEarned

    } catch (error) {
      console.error("[Achievement Service] Error checking meal achievements:", error)
      return []
    }
  }

  // Check weekly and monthly consistency achievements
  static async checkConsistencyAchievements(userId) {
    try {
      console.log("[Achievement Service] Checking consistency achievements for user:", userId)

      const achievementUpdates = []

      // Get user goals first
      const userGoals = await sql`
        SELECT calorie_goal, protein_goal FROM users WHERE user_id = ${parseInt(userId)}
      `
      
      if (userGoals.length === 0) return []
      
      const { calorie_goal, protein_goal } = userGoals[0]

      // Weekly achievements (last 7 days)
      const weeklyProgress = await sql`
        SELECT COUNT(DISTINCT meal_date) as goal_days
        FROM (
          SELECT 
            meal_date,
            SUM(calories) as daily_calories,
            SUM(protein) as daily_protein
          FROM meals 
          WHERE user_id = ${parseInt(userId)}
            AND meal_date >= CURRENT_DATE - INTERVAL '7 days'
            AND meal_date <= CURRENT_DATE
          GROUP BY meal_date
          HAVING 
            SUM(calories) >= ${calorie_goal * 0.8}
            AND SUM(protein) >= ${protein_goal * 0.8}
        ) goal_days
      `

      const weeklyDays = weeklyProgress.length > 0 ? weeklyProgress[0].goal_days : 0

      if (weeklyDays >= 5) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('Weekly Warrior'),
          progress_value: weeklyDays
        })
      }

      if (weeklyDays >= 7) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('Perfect Week'),
          progress_value: weeklyDays
        })
      }

      // Monthly achievements (last 30 days)
      const monthlyProgress = await sql`
        SELECT COUNT(DISTINCT meal_date) as goal_days
        FROM (
          SELECT 
            meal_date,
            SUM(calories) as daily_calories,
            SUM(protein) as daily_protein
          FROM meals 
          WHERE user_id = ${parseInt(userId)}
            AND meal_date >= CURRENT_DATE - INTERVAL '30 days'
            AND meal_date <= CURRENT_DATE
          GROUP BY meal_date
          HAVING 
            SUM(calories) >= ${calorie_goal * 0.8}
            AND SUM(protein) >= ${protein_goal * 0.8}
        ) goal_days
      `

      const monthlyDays = monthlyProgress.length > 0 ? monthlyProgress[0].goal_days : 0

      if (monthlyDays >= 20) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('Monthly Champion'),
          progress_value: monthlyDays
        })
      }

      if (monthlyDays >= 25) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('Consistency King'),
          progress_value: monthlyDays
        })
      }

      return achievementUpdates

    } catch (error) {
      console.error("[Achievement Service] Error checking consistency achievements:", error)
      return []
    }
  }

  // Check streak achievements
  static async checkStreakAchievements(userId, achievementUpdates) {
    try {
      // Get user goals first
      const userGoals = await sql`
        SELECT calorie_goal, protein_goal FROM users WHERE user_id = ${parseInt(userId)}
      `
      
      if (userGoals.length === 0) return
      
      const { calorie_goal, protein_goal } = userGoals[0]
      
      // Get recent days where goals were met (simplified approach)
      const goalMetDays = await sql`
        SELECT 
          meal_date,
          SUM(calories) as daily_calories,
          SUM(protein) as daily_protein
        FROM meals 
        WHERE user_id = ${parseInt(userId)}
          AND meal_date >= CURRENT_DATE - INTERVAL '60 days'
        GROUP BY meal_date
        HAVING 
          SUM(calories) >= ${calorie_goal * 0.8}
          AND SUM(protein) >= ${protein_goal * 0.8}
        ORDER BY meal_date DESC
      `
      
      // Calculate current streak (consecutive days from today backwards)
      let currentStreak = 0
      const today = new Date().toISOString().split('T')[0]
      
      for (let i = 0; i < goalMetDays.length; i++) {
        const dayDate = new Date(goalMetDays[i].meal_date).toISOString().split('T')[0]
        const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        if (dayDate === expectedDate) {
          currentStreak++
        } else {
          break
        }
      }

      // Check streak achievements
      if (currentStreak >= 3) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('3-Day Streak'),
          progress_value: Math.min(currentStreak, 3)
        })
      }

      if (currentStreak >= 7) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('7-Day Streak'),
          progress_value: Math.min(currentStreak, 7)
        })
      }

      if (currentStreak >= 30) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('30-Day Streak'),
          progress_value: Math.min(currentStreak, 30)
        })
      }

    } catch (error) {
      console.error("[Achievement Service] Error checking streak achievements:", error)
    }
  }

  // Check milestone achievements
  static async checkMilestoneAchievements(userId, achievementUpdates) {
    try {
      // Get user goals first
      const userGoals = await sql`
        SELECT calorie_goal, protein_goal FROM users WHERE user_id = ${parseInt(userId)}
      `
      
      if (userGoals.length === 0) return
      
      const { calorie_goal, protein_goal } = userGoals[0]
      
      // Total days with goals met
      const totalDays = await sql`
        SELECT COUNT(DISTINCT meal_date) as total_goal_days
        FROM (
          SELECT 
            meal_date,
            SUM(calories) as daily_calories,
            SUM(protein) as daily_protein
          FROM meals 
          WHERE user_id = ${parseInt(userId)}
          GROUP BY meal_date
          HAVING 
            SUM(calories) >= ${calorie_goal * 0.8}
            AND SUM(protein) >= ${protein_goal * 0.8}
        ) goal_days
      `

      const goalDays = totalDays.length > 0 ? totalDays[0].total_goal_days : 0

      // First Goal
      if (goalDays >= 1) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('First Goal'),
          progress_value: 1
        })
      }

      // Century Club
      if (goalDays >= 100) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('Century Club'),
          progress_value: Math.min(goalDays, 100)
        })
      }

      // Total protein consumed
      const totalProtein = await sql`
        SELECT COALESCE(SUM(protein), 0) as total_protein
        FROM meals
        WHERE user_id = ${parseInt(userId)}
      `

      const proteinConsumed = totalProtein.length > 0 ? totalProtein[0].total_protein : 0

      if (proteinConsumed >= 1000) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('Protein Master'),
          progress_value: Math.min(proteinConsumed, 1000)
        })
      }

      // Total calories logged
      const totalCalories = await sql`
        SELECT COALESCE(SUM(calories), 0) as total_calories
        FROM meals
        WHERE user_id = ${parseInt(userId)}
      `

      const caloriesLogged = totalCalories.length > 0 ? totalCalories[0].total_calories : 0

      if (caloriesLogged >= 50000) {
        achievementUpdates.push({
          achievement_id: await this.getAchievementId('Calorie Counter'),
          progress_value: Math.min(caloriesLogged, 50000)
        })
      }

    } catch (error) {
      console.error("[Achievement Service] Error checking milestone achievements:", error)
    }
  }

  // Initialize achievements for new user
  static async initializeUserAchievements(userId) {
    try {
      console.log("[Achievement Service] Initializing achievements for new user:", userId)
      
      // First check if user exists
      const userExists = await sql`
        SELECT user_id FROM users WHERE user_id = ${parseInt(userId)}
      `
      
      if (userExists.length === 0) {
        console.log(`[Achievement Service] User ${userId} does not exist, skipping initialization`)
        return false
      }
      
      // Get all available achievements
      const achievements = await sql`
        SELECT achievement_id FROM achievements WHERE is_active = true
      `
      
      // Initialize user achievements with 0 progress
      for (const achievement of achievements) {
        await sql`
          INSERT INTO user_achievements (user_id, achievement_id, current_progress, is_earned)
          VALUES (${parseInt(userId)}, ${achievement.achievement_id}, 0, false)
          ON CONFLICT (user_id, achievement_id) DO NOTHING
        `
      }
      
      console.log(`[Achievement Service] Initialized ${achievements.length} achievements for user ${userId}`)
      return true
      
    } catch (error) {
      console.error("[Achievement Service] Error initializing user achievements:", error)
      return false
    }
  }

  // Send achievement notification email via Python service
  static async sendAchievementEmail(userId, achievementData) {
    try {
      // Get user email
      const userResult = await sql`
        SELECT u.name, u.email, ep.achievement_notifications_enabled
        FROM users u
        LEFT JOIN email_preferences ep ON u.user_id = ep.user_id
        WHERE u.user_id = ${parseInt(userId)} AND u.email IS NOT NULL
      `
      
      if (userResult.length === 0) {
        console.log(`[Achievement Service] No email found for user ${userId}`)
        return
      }
      
      const user = userResult[0]
      
      // Check if achievement notifications are enabled
      if (user.achievement_notifications_enabled === false) {
        console.log(`[Achievement Service] Achievement notifications disabled for user ${userId}`)
        return
      }
      
      console.log(`[Achievement Service] Sending achievement email to ${user.email}`)
      
      // Call Python email service via API
      const response = await fetch('http://localhost:3000/api/email/achievement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          email: user.email,
          name: user.name,
          achievement_name: achievementData.name,
          achievement_description: achievementData.description
        })
      })
      
      if (response.ok) {
        console.log(`[Achievement Service] Achievement email sent successfully to ${user.email}`)
      } else {
        console.error(`[Achievement Service] Failed to send achievement email: ${response.status}`)
      }
      
    } catch (error) {
      console.error("[Achievement Service] Error sending achievement email:", error)
    }
  }

  // Helper function to get achievement ID by name
  static async getAchievementId(name) {
    try {
      const result = await sql`
        SELECT achievement_id FROM achievements WHERE name = ${name} LIMIT 1
      `
      return result.length > 0 ? result[0].achievement_id : null
    } catch (error) {
      console.error("[Achievement Service] Error getting achievement ID:", error)
      return null
    }
  }
}
