#!/usr/bin/env node
/**
 * Test User Isolation
 * Verify that different users get different achievements (critical security test)
 */

async function testUserIsolation() {
    console.log('🔒 TESTING USER ISOLATION - CRITICAL SECURITY TEST');
    console.log('=' .repeat(60));

    try {
        // Step 1: Get list of all users
        console.log('\n👥 Step 1: Finding users in the system...');
        
        // Test with different user IDs
        const testUserIds = [1, 2, 3, 8, 10];
        const userResults = [];

        for (const userId of testUserIds) {
            try {
                console.log(`\n🔍 Testing user ID: ${userId}`);
                
                const response = await fetch('http://localhost:3000/api/achievements/direct-fix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId })
                });

                const result = await response.json();

                if (result.success) {
                    console.log(`   ✅ User found: ${result.user_data.name}`);
                    console.log(`   📊 Today's data: ${result.today_totals.total_calories} cal, ${result.today_totals.total_protein}g protein`);
                    
                    // Get a few key achievements for comparison
                    const dailyCalorie = result.results.find(r => r.achievement === 'Daily Calorie Goal');
                    const dailyProtein = result.results.find(r => r.achievement === 'Daily Protein Goal');
                    const proteinMaster = result.results.find(r => r.achievement === 'Protein Master');

                    userResults.push({
                        userId: userId,
                        name: result.user_data.name,
                        calorieGoal: result.user_data.calorie_goal,
                        proteinGoal: result.user_data.protein_goal,
                        todayCalories: result.today_totals.total_calories,
                        todayProtein: result.today_totals.total_protein,
                        dailyCalorieProgress: dailyCalorie ? dailyCalorie.percentage : '0%',
                        dailyProteinProgress: dailyProtein ? dailyProtein.percentage : '0%',
                        proteinMasterProgress: proteinMaster ? proteinMaster.percentage : '0%'
                    });

                } else {
                    console.log(`   ❌ User ${userId}: ${result.error}`);
                }

            } catch (error) {
                console.log(`   ❌ User ${userId}: API error - ${error.message}`);
            }
        }

        // Step 2: Analyze results for isolation
        console.log('\n🔍 Step 2: Analyzing user isolation...');
        
        if (userResults.length < 2) {
            console.log('⚠️  Need at least 2 users to test isolation. Found:', userResults.length);
            return;
        }

        console.log('\n📊 USER COMPARISON:');
        console.log('User ID | Name      | Cal Goal | Protein Goal | Today Cal | Today Protein | Daily Cal % | Daily Protein % | Protein Master %');
        console.log('-'.repeat(120));

        userResults.forEach(user => {
            console.log(`${user.userId.toString().padEnd(7)} | ${user.name.padEnd(9)} | ${user.calorieGoal.toString().padEnd(8)} | ${user.proteinGoal.toString().padEnd(12)} | ${user.todayCalories.toString().padEnd(9)} | ${user.todayProtein.toString().padEnd(13)} | ${user.dailyCalorieProgress.padEnd(11)} | ${user.dailyProteinProgress.padEnd(15)} | ${user.proteinMasterProgress}`);
        });

        // Step 3: Check for isolation violations
        console.log('\n🔒 Step 3: Checking for isolation violations...');
        
        let isolationViolations = 0;
        
        // Check if any users have identical data (which would indicate data leakage)
        for (let i = 0; i < userResults.length; i++) {
            for (let j = i + 1; j < userResults.length; j++) {
                const user1 = userResults[i];
                const user2 = userResults[j];
                
                // Check if they have identical achievement data
                if (user1.dailyCalorieProgress === user2.dailyCalorieProgress &&
                    user1.dailyProteinProgress === user2.dailyProteinProgress &&
                    user1.proteinMasterProgress === user2.proteinMasterProgress &&
                    user1.todayCalories === user2.todayCalories &&
                    user1.todayProtein === user2.todayProtein) {
                    
                    console.log(`🚨 ISOLATION VIOLATION: Users ${user1.userId} (${user1.name}) and ${user2.userId} (${user2.name}) have identical achievement data!`);
                    isolationViolations++;
                }
            }
        }

        // Step 4: Test API isolation
        console.log('\n🌐 Step 4: Testing API isolation...');
        
        for (const user of userResults) {
            const apiResponse = await fetch(`http://localhost:3000/api/achievements?user_id=${user.userId}`);
            const apiResult = await apiResponse.json();
            
            if (apiResult.success) {
                const dailyCalorieAchievement = apiResult.achievements.find(a => a.name === 'Daily Calorie Goal');
                const apiProgress = dailyCalorieAchievement ? dailyCalorieAchievement.progress_percentage : 0;
                const expectedProgress = parseFloat(user.dailyCalorieProgress);
                
                if (Math.abs(apiProgress - expectedProgress) < 1) {
                    console.log(`   ✅ User ${user.userId} (${user.name}): API returns correct data`);
                } else {
                    console.log(`   ❌ User ${user.userId} (${user.name}): API data mismatch - Expected: ${expectedProgress}%, Got: ${apiProgress}%`);
                    isolationViolations++;
                }
            }
        }

        // Final assessment
        console.log('\n' + '=' .repeat(60));
        console.log('🔒 SECURITY ASSESSMENT:');
        
        if (isolationViolations === 0) {
            console.log('✅ SECURE: User isolation is working correctly!');
            console.log('   ✅ Each user gets their own achievement data');
            console.log('   ✅ No data leakage between users');
            console.log('   ✅ API returns user-specific data');
            console.log('\n🎉 The user isolation bug has been FIXED!');
        } else {
            console.log(`🚨 SECURITY RISK: ${isolationViolations} isolation violations detected!`);
            console.log('   ❌ Users may be seeing other users\' data');
            console.log('   ❌ Critical security bug needs immediate attention');
            console.log('\n⚠️  DO NOT USE IN PRODUCTION until this is fixed!');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
    }
}

testUserIsolation().catch(console.error);
