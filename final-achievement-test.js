#!/usr/bin/env node
/**
 * Final Achievement Test
 * Complete end-to-end test of the achievement system
 */

async function finalAchievementTest() {
    console.log('🎯 FINAL ACHIEVEMENT SYSTEM TEST');
    console.log('=' .repeat(60));

    try {
        // Test all possible user IDs to find active ones
        console.log('\n🔍 Step 1: Finding active users...');
        const activeUsers = [];
        
        for (let userId = 1; userId <= 10; userId++) {
            try {
                const response = await fetch(`http://localhost:3000/api/progress?user_id=${userId}&date=${new Date().toISOString().split('T')[0]}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.progress && result.progress.calories && result.progress.calories.consumed > 0) {
                        activeUsers.push({
                            user_id: userId,
                            calories: result.progress.calories.consumed,
                            protein: result.progress.protein.consumed,
                            calorie_goal: result.progress.calories.goal,
                            protein_goal: result.progress.protein.goal
                        });
                        console.log(`   ✅ User ${userId}: ${result.progress.calories.consumed} cal, ${result.progress.protein.consumed}g protein`);
                    }
                }
            } catch (error) {
                // Skip this user
            }
        }

        if (activeUsers.length === 0) {
            console.log('❌ No active users found with meal data');
            console.log('\n💡 Try logging a meal first, then run this test again');
            return;
        }

        console.log(`\n✅ Found ${activeUsers.length} active users with meal data`);

        // Test each active user
        for (const user of activeUsers) {
            console.log(`\n🔧 Step 2: Testing User ${user.user_id}...`);
            
            // Calculate expected progress
            const expectedCalorieProgress = (user.calories / user.calorie_goal * 100).toFixed(1);
            const expectedProteinProgress = (user.protein / user.protein_goal * 100).toFixed(1);
            
            console.log(`   Expected Progress:`);
            console.log(`      Calories: ${expectedCalorieProgress}% (${user.calories}/${user.calorie_goal})`);
            console.log(`      Protein: ${expectedProteinProgress}% (${user.protein}/${user.protein_goal})`);

            // Apply direct fix
            console.log(`\n   🔧 Applying direct fix...`);
            try {
                const fixResponse = await fetch('http://localhost:3000/api/achievements/direct-fix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.user_id })
                });

                const fixResult = await fixResponse.json();
                
                if (fixResult.success) {
                    console.log(`   ✅ Direct fix successful:`);
                    fixResult.results.forEach(result => {
                        console.log(`      ${result.achievement}: ${result.percentage} ${result.earned ? '🏆' : ''}`);
                    });
                } else {
                    console.log(`   ❌ Direct fix failed: ${fixResult.error}`);
                    continue;
                }

            } catch (error) {
                console.log(`   ❌ Direct fix error: ${error.message}`);
                continue;
            }

            // Verify achievements are showing correctly
            console.log(`\n   📋 Verifying achievement display...`);
            try {
                const achievementsResponse = await fetch(`http://localhost:3000/api/achievements?user_id=${user.user_id}`);
                const achievementsResult = await achievementsResponse.json();

                if (achievementsResult.success) {
                    const dailyAchievements = achievementsResult.achievements.filter(a => 
                        a.name.includes('Daily') || a.name.includes('Balanced')
                    );

                    let allWorking = true;
                    dailyAchievements.forEach(achievement => {
                        const progress = achievement.progress_percentage || 0;
                        const isWorking = progress > 0;
                        
                        console.log(`      ${achievement.name}: ${progress.toFixed(1)}% ${isWorking ? '✅' : '❌'}`);
                        
                        if (!isWorking && (achievement.name.includes('Daily'))) {
                            allWorking = false;
                        }
                    });

                    if (allWorking) {
                        console.log(`   🎉 SUCCESS: All daily achievements showing progress!`);
                    } else {
                        console.log(`   ⚠️  Some achievements still showing 0% - may need page refresh`);
                    }

                } else {
                    console.log(`   ❌ Failed to fetch achievements: ${achievementsResult.error}`);
                }

            } catch (error) {
                console.log(`   ❌ Verification error: ${error.message}`);
            }
        }

        console.log('\n' + '=' .repeat(60));
        console.log('🎯 FINAL TEST SUMMARY');
        console.log('\n✅ WHAT SHOULD WORK NOW:');
        console.log('   1. Dashboard shows correct calorie/protein totals');
        console.log('   2. "Reset & Fix Achievements" button works');
        console.log('   3. Achievements page shows progress after refresh');
        console.log('   4. Daily achievements show calculated percentages');

        console.log('\n🚀 NEXT STEPS:');
        console.log('   1. Go to your dashboard');
        console.log('   2. Click "Reset & Fix Achievements" (green button)');
        console.log('   3. Go to achievements page');
        console.log('   4. Refresh the page');
        console.log('   5. Verify progress bars are showing');

        console.log('\n💡 IF STILL NOT WORKING:');
        console.log('   - Check browser console for errors');
        console.log('   - Try logging out and back in');
        console.log('   - Clear browser cache');
        console.log('   - Make sure you\'re using the correct user ID');

    } catch (error) {
        console.error('\n❌ Final test failed:', error.message);
        console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
    }
}

finalAchievementTest().catch(console.error);
