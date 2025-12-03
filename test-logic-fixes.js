#!/usr/bin/env node
/**
 * Test Logic Fixes
 * Verify all logical issues have been resolved
 */

async function testLogicFixes() {
    console.log('🧠 TESTING LOGIC FIXES');
    console.log('=' .repeat(60));

    try {
        // Step 1: Test achievement calculation and categorization
        console.log('\n🔧 Step 1: Testing achievement calculation logic...');
        
        const fixResponse = await fetch('http://localhost:3000/api/achievements/direct-fix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: 8 }) // Test with known user
        });

        const fixResult = await fixResponse.json();

        if (fixResult.success) {
            console.log(`✅ Calculation working for ${fixResult.user_data.name}`);
            console.log(`📊 Today's data: ${fixResult.today_totals.total_calories} cal, ${fixResult.today_totals.total_protein}g protein`);
            
            // Check for logical consistency
            let logicalErrors = 0;
            
            console.log('\n🔍 Checking logical consistency...');
            
            fixResult.results.forEach(result => {
                const percentage = parseFloat(result.percentage);
                
                // Logic check 1: Earned achievements should be 100%
                if (result.earned && percentage < 100) {
                    console.log(`❌ LOGIC ERROR: ${result.achievement} is marked as earned but shows ${result.percentage}`);
                    logicalErrors++;
                }
                
                // Logic check 2: Non-earned achievements should be < 100%
                if (!result.earned && percentage >= 100) {
                    console.log(`❌ LOGIC ERROR: ${result.achievement} shows ${result.percentage} but is not earned`);
                    logicalErrors++;
                }
                
                // Logic check 3: Progress should never exceed 100%
                if (percentage > 100) {
                    console.log(`❌ LOGIC ERROR: ${result.achievement} shows ${result.percentage} (over 100%)`);
                    logicalErrors++;
                }
                
                console.log(`   ${result.earned ? '🏆' : '📈'} ${result.achievement}: ${result.percentage} ${result.earned ? '(EARNED)' : '(IN PROGRESS)'}`);
            });

            // Step 2: Test API response logic
            console.log('\n🌐 Step 2: Testing API response logic...');
            
            const apiResponse = await fetch('http://localhost:3000/api/achievements?user_id=8');
            const apiResult = await apiResponse.json();

            if (apiResult.success) {
                const achievements = apiResult.achievements;
                
                // Check categorization logic
                const earned = achievements.filter(a => a.is_earned === true);
                const inProgress = achievements.filter(a => a.is_earned === false && (a.progress_percentage || 0) > 0);
                const locked = achievements.filter(a => a.is_earned === false && (a.progress_percentage || 0) === 0);
                
                console.log(`📊 Categorization: ${earned.length} Earned, ${inProgress.length} In Progress, ${locked.length} Locked`);
                
                // Check for overlapping categories (should be impossible)
                const totalCategorized = earned.length + inProgress.length + locked.length;
                if (totalCategorized !== achievements.length) {
                    console.log(`❌ CATEGORIZATION ERROR: ${achievements.length} total but ${totalCategorized} categorized`);
                    logicalErrors++;
                }
                
                // Check each achievement's logic
                achievements.forEach(achievement => {
                    const progress = achievement.progress_percentage || 0;
                    
                    // Earned achievements should show 100%
                    if (achievement.is_earned && progress !== 100) {
                        console.log(`❌ API LOGIC ERROR: ${achievement.name} is earned but shows ${progress}%`);
                        logicalErrors++;
                    }
                    
                    // Non-earned should show < 100%
                    if (!achievement.is_earned && progress >= 100) {
                        console.log(`❌ API LOGIC ERROR: ${achievement.name} shows ${progress}% but not earned`);
                        logicalErrors++;
                    }
                });

                // Step 3: Test specific achievement types
                console.log('\n🎯 Step 3: Testing specific achievement logic...');
                
                const dailyCalorie = achievements.find(a => a.name === 'Daily Calorie Goal');
                const dailyProtein = achievements.find(a => a.name === 'Daily Protein Goal');
                
                if (dailyCalorie) {
                    const expectedCalorieProgress = (fixResult.today_totals.total_calories / fixResult.user_data.calorie_goal) * 100;
                    const actualCalorieProgress = dailyCalorie.progress_percentage || 0;
                    
                    console.log(`   Daily Calorie: Expected ${expectedCalorieProgress.toFixed(1)}%, Got ${actualCalorieProgress}%`);
                    
                    if (Math.abs(expectedCalorieProgress - actualCalorieProgress) > 5) {
                        console.log(`❌ CALCULATION ERROR: Daily Calorie progress mismatch`);
                        logicalErrors++;
                    }
                }
                
                if (dailyProtein) {
                    const expectedProteinProgress = (fixResult.today_totals.total_protein / fixResult.user_data.protein_goal) * 100;
                    const actualProteinProgress = dailyProtein.progress_percentage || 0;
                    
                    console.log(`   Daily Protein: Expected ${expectedProteinProgress.toFixed(1)}%, Got ${actualProteinProgress}%`);
                    
                    if (Math.abs(expectedProteinProgress - actualProteinProgress) > 5) {
                        console.log(`❌ CALCULATION ERROR: Daily Protein progress mismatch`);
                        logicalErrors++;
                    }
                }

                // Step 4: Final assessment
                console.log('\n' + '=' .repeat(60));
                console.log('🧠 LOGIC ASSESSMENT:');
                
                if (logicalErrors === 0) {
                    console.log('✅ LOGIC PERFECT: All logical issues have been fixed!');
                    console.log('   ✅ Earned achievements show 100%');
                    console.log('   ✅ In-progress achievements show < 100%');
                    console.log('   ✅ No progress exceeds 100%');
                    console.log('   ✅ Categorization is mutually exclusive');
                    console.log('   ✅ Calculations are accurate');
                    console.log('\n🎉 The achievement system is now logically consistent!');
                } else {
                    console.log(`❌ LOGIC ISSUES: ${logicalErrors} logical errors detected!`);
                    console.log('   ❌ Some achievements have inconsistent states');
                    console.log('   ❌ Need to review achievement logic');
                    console.log('\n⚠️  Please fix the remaining logical issues.');
                }

                // Step 5: Test frontend categorization
                console.log('\n🖥️  Step 4: Testing frontend categorization...');
                
                console.log('Frontend should show:');
                console.log(`   🏆 Earned (${earned.length}): Only achievements with is_earned = true`);
                console.log(`   📈 In Progress (${inProgress.length}): Only achievements with is_earned = false AND progress > 0`);
                console.log(`   🔒 Locked (${locked.length}): Only achievements with is_earned = false AND progress = 0`);
                
                // Show sample from each category
                if (earned.length > 0) {
                    console.log(`      Sample earned: ${earned[0].name} (${earned[0].progress_percentage}%)`);
                }
                if (inProgress.length > 0) {
                    console.log(`      Sample in progress: ${inProgress[0].name} (${inProgress[0].progress_percentage}%)`);
                }
                if (locked.length > 0) {
                    console.log(`      Sample locked: ${locked[0].name} (${locked[0].progress_percentage}%)`);
                }

            } else {
                console.log(`❌ API test failed: ${apiResult.error}`);
            }

        } else {
            console.log(`❌ Calculation test failed: ${fixResult.error}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
    }
}

testLogicFixes().catch(console.error);
