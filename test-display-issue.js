#!/usr/bin/env node
/**
 * Test Display Issue
 * Check why achievements aren't showing progress
 */

async function testDisplayIssue() {
    console.log('🔍 TESTING ACHIEVEMENT DISPLAY ISSUE');
    console.log('=' .repeat(50));

    try {
        // Step 1: Check what users have meal data
        console.log('\n📊 Step 1: Checking users with meal data...');
        const debugResponse = await fetch('http://localhost:3000/api/achievements/debug-display');
        const debugResult = await debugResponse.json();

        if (debugResult.success) {
            console.log(`✅ Found ${debugResult.debug_data.length} users with meal data:`);
            
            debugResult.debug_data.forEach(user => {
                console.log(`\n   User ${user.user_id}: ${user.name}`);
                console.log(`      Meals: ${user.meal_data.calories}, ${user.meal_data.protein}`);
                console.log(`      Expected: ${user.meal_data.calorie_progress}, ${user.meal_data.protein_progress}`);
                
                console.log(`      Achievements in DB:`);
                user.achievements.forEach(ach => {
                    console.log(`         ${ach.name}: ${ach.current_progress} → ${ach.progress_percentage}%`);
                });
            });

            // Step 2: Test the fix for the first user
            const firstUser = debugResult.debug_data[0];
            if (firstUser) {
                console.log(`\n🔧 Step 2: Testing direct fix for ${firstUser.name}...`);
                
                const fixResponse = await fetch('http://localhost:3000/api/achievements/direct-fix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: firstUser.user_id })
                });

                const fixResult = await fixResponse.json();
                
                if (fixResult.success) {
                    console.log(`✅ Fix successful for ${fixResult.user_data.name}:`);
                    fixResult.results.forEach(result => {
                        console.log(`      ${result.achievement}: ${result.percentage}`);
                    });

                    // Step 3: Check if the API now returns correct data
                    console.log(`\n📋 Step 3: Checking API response after fix...`);
                    const apiResponse = await fetch(`http://localhost:3000/api/achievements?user_id=${firstUser.user_id}`);
                    const apiResult = await apiResponse.json();

                    if (apiResult.success) {
                        const dailyAchievements = apiResult.achievements.filter(a => 
                            a.name.includes('Daily')
                        );

                        console.log(`📈 API Response:`);
                        dailyAchievements.forEach(achievement => {
                            console.log(`      ${achievement.name}:`);
                            console.log(`         current_progress: ${achievement.current_progress}`);
                            console.log(`         progress_percentage: ${achievement.progress_percentage}%`);
                            console.log(`         ${achievement.progress_percentage > 0 ? '✅ WORKING' : '❌ STILL 0%'}`);
                        });

                        const workingCount = dailyAchievements.filter(a => (a.progress_percentage || 0) > 0).length;
                        
                        if (workingCount > 0) {
                            console.log(`\n🎉 SUCCESS: ${workingCount} achievements showing progress!`);
                            console.log(`\n💡 The issue is likely in the frontend display logic.`);
                            console.log(`   Try clicking "Direct Fix" on the achievements page.`);
                        } else {
                            console.log(`\n❌ STILL BROKEN: All achievements showing 0%`);
                            console.log(`   The database update is not working properly.`);
                        }

                    } else {
                        console.log(`❌ API call failed: ${apiResult.error}`);
                    }

                } else {
                    console.log(`❌ Fix failed: ${fixResult.error}`);
                }
            }

        } else {
            console.log(`❌ Debug failed: ${debugResult.error}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
    }
}

testDisplayIssue().catch(console.error);
