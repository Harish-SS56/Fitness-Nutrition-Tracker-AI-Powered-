#!/usr/bin/env node
/**
 * Complete Achievement Fix
 * This will fix all achievement synchronization issues
 */

async function completeAchievementFix() {
    console.log('🔧 COMPLETE ACHIEVEMENT SYNCHRONIZATION FIX');
    console.log('=' .repeat(60));

    try {
        // Step 1: Find users with meal data
        console.log('\n🔍 Step 1: Finding users with meal data...');
        
        const testUserIds = [1, 5, 6, 8, 9, 10];
        const activeUsers = [];

        for (const userId of testUserIds) {
            try {
                const response = await fetch(`http://localhost:3000/api/achievements/debug?user_id=${userId}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.debug_info.user_exists) {
                        const user = result.debug_info.user_data;
                        const totals = result.debug_info.today_totals;
                        
                        console.log(`   User ${userId}: ${user.name} (${totals.total_calories} cal, ${totals.total_protein}g protein)`);
                        
                        if (totals.total_calories > 0 || totals.total_protein > 0) {
                            activeUsers.push({
                                user_id: userId,
                                name: user.name,
                                totals: totals,
                                goals: { calorie_goal: user.calorie_goal, protein_goal: user.protein_goal }
                            });
                        }
                    }
                }
            } catch (error) {
                // Skip this user
            }
        }

        if (activeUsers.length === 0) {
            console.log('❌ No users found with meal data');
            return;
        }

        console.log(`\n✅ Found ${activeUsers.length} users with meal data`);

        // Step 2: Fix achievements for each active user
        for (const user of activeUsers) {
            console.log(`\n🔧 Step 2: Fixing achievements for ${user.name} (ID: ${user.user_id})`);

            try {
                const response = await fetch('http://localhost:3000/api/achievements/direct-fix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.user_id })
                });

                const result = await response.json();

                if (result.success) {
                    console.log(`   ✅ ${user.name}: Direct fix successful`);
                    result.results.forEach(r => {
                        console.log(`      🏆 ${r.achievement}: ${r.percentage} ${r.earned ? '(EARNED!)' : ''}`);
                    });
                } else {
                    console.log(`   ❌ ${user.name}: Fix failed - ${result.error}`);
                }

            } catch (error) {
                console.log(`   ❌ ${user.name}: Error - ${error.message}`);
            }
        }

        // Step 3: Verify the fixes
        console.log('\n📋 Step 3: Verifying fixes...');
        
        for (const user of activeUsers) {
            try {
                const response = await fetch(`http://localhost:3000/api/achievements?user_id=${user.user_id}`);
                const result = await response.json();

                if (result.success) {
                    const dailyAchievements = result.achievements.filter(a => 
                        a.name.includes('Daily') || a.name.includes('Balanced')
                    );

                    console.log(`\n   ${user.name} (ID: ${user.user_id}):`);
                    dailyAchievements.forEach(achievement => {
                        const progress = achievement.progress_percentage || 0;
                        console.log(`      ${achievement.name}: ${progress.toFixed(1)}% ${progress > 0 ? '✅' : '❌'}`);
                    });

                    const workingCount = dailyAchievements.filter(a => (a.progress_percentage || 0) > 0).length;
                    console.log(`      Status: ${workingCount}/${dailyAchievements.length} achievements showing progress`);
                }

            } catch (error) {
                console.log(`   ❌ ${user.name}: Verification failed - ${error.message}`);
            }
        }

        console.log('\n' + '=' .repeat(60));
        console.log('🎯 COMPLETE ACHIEVEMENT FIX SUMMARY');
        console.log('\n💡 NEXT STEPS:');
        console.log('   1. Go to your achievements page');
        console.log('   2. Click the "Direct Fix" button');
        console.log('   3. Refresh the page');
        console.log('   4. Verify progress bars are showing');
        console.log('\n🎉 If you see progress percentages above, the fix worked!');

    } catch (error) {
        console.error('\n❌ Complete fix failed:', error.message);
        console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
    }
}

completeAchievementFix().catch(console.error);
