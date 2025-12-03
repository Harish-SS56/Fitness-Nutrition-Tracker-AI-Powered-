#!/usr/bin/env node
/**
 * Achievement Synchronization Test
 * Tests the complete achievement sync flow
 */

async function testAchievementSync() {
    console.log('🏆 ACHIEVEMENT SYNCHRONIZATION TEST');
    console.log('=' .repeat(60));

    // Test user ID (replace with actual user ID from your database)
    const TEST_USER_ID = 6; // divagar's user ID

    try {
        console.log(`\n🔍 Testing achievement sync for user ID: ${TEST_USER_ID}`);

        // Step 1: Force sync achievements
        console.log('\n📊 Step 1: Force syncing achievements...');
        const syncResponse = await fetch('http://localhost:3000/api/achievements/force-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: TEST_USER_ID
            })
        });

        const syncResult = await syncResponse.json();
        console.log('Sync Result:', syncResult);

        if (syncResult.success) {
            console.log('✅ Force sync completed successfully');
            console.log(`📈 Steps completed: ${syncResult.steps_completed?.join(', ')}`);
            
            if (syncResult.newly_earned && syncResult.newly_earned.length > 0) {
                console.log(`🎉 Newly earned achievements: ${syncResult.newly_earned.length}`);
                syncResult.newly_earned.forEach(achievement => {
                    console.log(`   🏆 ${achievement.name}: ${achievement.description}`);
                });
            }
        } else {
            console.log('❌ Force sync failed:', syncResult.error);
        }

        // Step 2: Fetch updated achievements
        console.log('\n📋 Step 2: Fetching updated achievements...');
        const achievementsResponse = await fetch(`http://localhost:3000/api/achievements?user_id=${TEST_USER_ID}`);
        const achievementsResult = await achievementsResponse.json();

        if (achievementsResult.success) {
            console.log('✅ Achievements fetched successfully');
            console.log(`📊 Total achievements: ${achievementsResult.stats.total_achievements}`);
            console.log(`🏆 Earned achievements: ${achievementsResult.stats.earned_achievements}`);
            console.log(`🥇 Nutrition badges: ${achievementsResult.stats.nutrition_badges}`);
            console.log(`📅 Consistency badges: ${achievementsResult.stats.consistency_badges}`);
            console.log(`🎯 Milestone badges: ${achievementsResult.stats.milestone_badges}`);

            // Show progress on daily achievements
            const dailyAchievements = achievementsResult.achievements.filter(a => 
                a.name.includes('Daily') || a.name.includes('Balanced')
            );

            if (dailyAchievements.length > 0) {
                console.log('\n📈 Daily Achievement Progress:');
                dailyAchievements.forEach(achievement => {
                    const progress = achievement.current_progress || 0;
                    const target = achievement.target_value || 1;
                    const percentage = Math.min((progress / target) * 100, 100);
                    
                    console.log(`   ${achievement.name}: ${percentage.toFixed(1)}% (${progress.toFixed(2)}/${target})`);
                    
                    if (achievement.is_earned) {
                        console.log(`      🎉 EARNED on ${new Date(achievement.earned_at).toLocaleDateString()}`);
                    }
                });
            }

            // Show recent achievements
            if (achievementsResult.recent_achievements && achievementsResult.recent_achievements.length > 0) {
                console.log('\n🎊 Recent Achievements (Last 7 days):');
                achievementsResult.recent_achievements.forEach(achievement => {
                    console.log(`   🏆 ${achievement.name} - ${new Date(achievement.earned_at).toLocaleDateString()}`);
                });
            }

        } else {
            console.log('❌ Failed to fetch achievements:', achievementsResult.error);
        }

        // Step 3: Test meal logging and achievement trigger
        console.log('\n🍽️ Step 3: Testing meal logging achievement trigger...');
        const mealResponse = await fetch('http://localhost:3000/api/meals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: TEST_USER_ID,
                meal_text: 'Test meal for achievement sync',
                calories: 100,
                protein: 10,
                fat: 5,
                carbs: 15,
                fiber: 2
            })
        });

        const mealResult = await mealResponse.json();
        
        if (mealResult.success) {
            console.log('✅ Test meal logged successfully');
            
            if (mealResult.new_achievements && mealResult.new_achievements.length > 0) {
                console.log(`🎉 New achievements earned from meal: ${mealResult.new_achievements.length}`);
                mealResult.new_achievements.forEach(achievement => {
                    console.log(`   🏆 ${achievement.name}`);
                });
            } else {
                console.log('📊 No new achievements earned from this meal');
            }
        } else {
            console.log('❌ Failed to log test meal:', mealResult.error);
        }

        console.log('\n' + '=' .repeat(60));
        console.log('🎯 ACHIEVEMENT SYNC TEST SUMMARY:');
        console.log(`   ✅ Force Sync: ${syncResult.success ? 'PASSED' : 'FAILED'}`);
        console.log(`   ✅ Achievement Fetch: ${achievementsResult.success ? 'PASSED' : 'FAILED'}`);
        console.log(`   ✅ Meal Trigger: ${mealResult.success ? 'PASSED' : 'FAILED'}`);
        
        if (syncResult.success && achievementsResult.success && mealResult.success) {
            console.log('\n🎉 ALL TESTS PASSED! Achievement synchronization is working correctly!');
        } else {
            console.log('\n⚠️  Some tests failed. Check the errors above.');
        }

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
    }
}

// Run the test
testAchievementSync().catch(console.error);
