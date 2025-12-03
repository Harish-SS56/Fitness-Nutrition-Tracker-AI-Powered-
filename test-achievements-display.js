#!/usr/bin/env node
/**
 * Test Achievement Display Fix
 * Verifies that achievements are showing correct progress
 */

async function testAchievementDisplay() {
    console.log('🧪 TESTING ACHIEVEMENT DISPLAY FIX');
    console.log('=' .repeat(60));

    const TEST_USER_ID = 8; // User from the screenshots

    try {
        console.log(`\n🔍 Testing for user ID: ${TEST_USER_ID}`);

        // Step 1: Fix daily achievements
        console.log('\n🔧 Step 1: Fixing daily achievements...');
        const fixResponse = await fetch('http://localhost:3000/api/achievements/fix-daily', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: TEST_USER_ID
            })
        });

        const fixResult = await fixResponse.json();
        console.log('Fix Result:', fixResult);

        if (fixResult.success) {
            console.log('✅ Daily achievements fixed successfully');
            console.log(`📊 Calories: ${fixResult.today_totals.total_calories}/${fixResult.user_data.calorie_goal}`);
            console.log(`🥩 Protein: ${fixResult.today_totals.total_protein}g/${fixResult.user_data.protein_goal}g`);
            
            fixResult.updates.forEach(update => {
                console.log(`   🏆 ${update.achievement}: ${update.percentage} ${update.earned ? '(EARNED!)' : ''}`);
            });
        } else {
            console.log('❌ Fix failed:', fixResult.error);
            return;
        }

        // Step 2: Fetch achievements to verify display
        console.log('\n📋 Step 2: Fetching achievements for display...');
        const achievementsResponse = await fetch(`http://localhost:3000/api/achievements?user_id=${TEST_USER_ID}`);
        const achievementsResult = await achievementsResponse.json();

        if (achievementsResult.success) {
            console.log('✅ Achievements fetched successfully');
            
            // Check daily achievements specifically
            const dailyAchievements = achievementsResult.achievements.filter(a => 
                a.name.includes('Daily') || a.name.includes('Balanced')
            );

            console.log('\n🎯 Daily Achievement Display Test:');
            dailyAchievements.forEach(achievement => {
                const progress = achievement.current_progress || 0;
                const progressPercentage = achievement.progress_percentage || 0;
                
                console.log(`\n📈 ${achievement.name}:`);
                console.log(`   Current Progress: ${progress}`);
                console.log(`   Progress Percentage: ${progressPercentage.toFixed(1)}%`);
                console.log(`   Target Value: ${achievement.target_value}`);
                console.log(`   Is Earned: ${achievement.is_earned}`);
                
                if (progressPercentage > 0) {
                    console.log(`   ✅ SHOWING PROGRESS: ${progressPercentage.toFixed(1)}%`);
                } else {
                    console.log(`   ❌ STILL SHOWING 0%`);
                }
            });

            // Summary
            const workingAchievements = dailyAchievements.filter(a => (a.progress_percentage || 0) > 0);
            console.log(`\n📊 Summary: ${workingAchievements.length}/${dailyAchievements.length} daily achievements showing progress`);

            if (workingAchievements.length === dailyAchievements.length) {
                console.log('🎉 ALL DAILY ACHIEVEMENTS ARE NOW SHOWING PROGRESS!');
            } else {
                console.log('⚠️  Some achievements still showing 0% - may need page refresh');
            }

        } else {
            console.log('❌ Failed to fetch achievements:', achievementsResult.error);
        }

        console.log('\n' + '=' .repeat(60));
        console.log('💡 NEXT STEPS:');
        console.log('   1. Refresh your achievements page');
        console.log('   2. Check if progress bars are now showing');
        console.log('   3. Daily Calorie Goal should show ~9.8%');
        console.log('   4. Daily Protein Goal should show ~6.3%');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
    }
}

// Run the test
testAchievementDisplay().catch(console.error);
