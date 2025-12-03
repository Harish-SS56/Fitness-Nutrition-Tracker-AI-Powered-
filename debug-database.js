#!/usr/bin/env node
/**
 * Debug Database Direct Query
 * Check what's actually in the database
 */

import { neon } from "@neondatabase/serverless"

const DATABASE_URL = "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
const sql = neon(DATABASE_URL)

async function debugDatabase() {
    console.log('🔍 DEBUGGING DATABASE DIRECTLY');
    console.log('=' .repeat(60));

    try {
        // Check users
        console.log('\n👥 USERS:');
        const users = await sql`SELECT user_id, name, calorie_goal, protein_goal FROM users ORDER BY user_id`
        users.forEach(user => {
            console.log(`   User ${user.user_id}: ${user.name} (${user.calorie_goal} cal, ${user.protein_goal}g protein)`);
        });

        // Check meals for today
        const today = new Date().toISOString().split('T')[0];
        console.log(`\n🍽️ MEALS FOR TODAY (${today}):`);
        const meals = await sql`
            SELECT user_id, meal_text, calories, protein, meal_date 
            FROM meals 
            WHERE meal_date = ${today}
            ORDER BY user_id, created_at
        `
        meals.forEach(meal => {
            console.log(`   User ${meal.user_id}: ${meal.meal_text} (${meal.calories} cal, ${meal.protein}g protein)`);
        });

        // Check user achievements
        console.log('\n🏆 USER ACHIEVEMENTS:');
        const userAchievements = await sql`
            SELECT 
                ua.user_id,
                a.name,
                ua.current_progress,
                ua.is_earned,
                ua.updated_at
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.achievement_id
            WHERE ua.user_id IN (6, 8) AND a.name LIKE '%Daily%'
            ORDER BY ua.user_id, a.name
        `
        userAchievements.forEach(ua => {
            console.log(`   User ${ua.user_id}: ${ua.name} = ${ua.current_progress} (${ua.is_earned ? 'EARNED' : 'not earned'}) - Updated: ${ua.updated_at}`);
        });

        // Check achievements table
        console.log('\n📋 ACHIEVEMENTS DEFINITIONS:');
        const achievements = await sql`
            SELECT achievement_id, name, achievement_type, target_value, target_unit
            FROM achievements 
            WHERE name LIKE '%Daily%'
            ORDER BY name
        `
        achievements.forEach(a => {
            console.log(`   ${a.achievement_id}: ${a.name} (${a.achievement_type}, target: ${a.target_value} ${a.target_unit})`);
        });

        // Test the API query directly
        console.log('\n🔧 TESTING API QUERY FOR USER 8:');
        const apiResult = await sql`
            SELECT 
                a.achievement_id,
                a.name,
                a.achievement_type,
                a.target_value,
                a.target_unit,
                COALESCE(ua.is_earned, false) as is_earned,
                COALESCE(ua.current_progress, 0) as current_progress,
                ua.earned_at,
                CASE 
                  WHEN ua.is_earned THEN 100
                  WHEN a.achievement_type = 'daily' THEN LEAST(100, COALESCE(ua.current_progress, 0) * 100)
                  WHEN a.target_value > 0 THEN LEAST(100, (COALESCE(ua.current_progress, 0) / a.target_value) * 100)
                  ELSE 0
                END as progress_percentage
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = 8
            WHERE a.is_active = true AND a.name LIKE '%Daily%'
            ORDER BY a.name
        `
        
        apiResult.forEach(result => {
            console.log(`   ${result.name}:`);
            console.log(`      Current Progress: ${result.current_progress}`);
            console.log(`      Progress Percentage: ${result.progress_percentage}%`);
            console.log(`      Achievement Type: ${result.achievement_type}`);
            console.log(`      Target Value: ${result.target_value}`);
        });

    } catch (error) {
        console.error('❌ Database error:', error);
    }
}

debugDatabase().catch(console.error);
