#!/usr/bin/env node
/**
 * Final Achievement System Test
 * Comprehensive test to verify all achievement logic and database storage
 */

async function testFinalAchievements() {
    console.log('🏆 FINAL ACHIEVEMENT SYSTEM TEST');
    console.log('=' .repeat(60));

    try {
        // Step 1: Test the direct fix API (main calculation logic)
        console.log('\n🔧 Step 1: Testing achievement calculation logic...');
        const fixResponse = await fetch('http://localhost:3000/api/achievements/direct-fix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: 8 })
        });

        const fixResult = await fixResponse.json();

        if (fixResult.success) {
            console.log(`✅ Calculation logic working for ${fixResult.user_data.name}`);
            console.log(`📊 Today's data: ${fixResult.today_totals.total_calories} cal, ${fixResult.today_totals.total_protein}g protein`);
            
            // Group results by category
            const categories = {
                nutrition: [],
                consistency: [],
                milestone: [],
                fitness: []
            };

            fixResult.results.forEach(result => {
                const category = result.category || 'other';
                if (categories[category]) {
                    categories[category].push(result);
                }
            });

            console.log('\n📈 ACHIEVEMENT PROGRESS BY CATEGORY:');
            Object.keys(categories).forEach(category => {
                if (categories[category].length > 0) {
                    console.log(`\n   ${category.toUpperCase()}:`);
                    categories[category].forEach(achievement => {
                        const status = achievement.earned ? '🏆' : 
                                     parseFloat(achievement.percentage) > 0 ? '📈' : '⭕';
                        console.log(`      ${status} ${achievement.achievement}: ${achievement.percentage}`);
                    });
                }
            });

            // Step 2: Verify database storage
            console.log('\n💾 Step 2: Verifying database storage...');
            const apiResponse = await fetch(`http://localhost:3000/api/achievements?user_id=8`);
            const apiResult = await apiResponse.json();

            if (apiResult.success) {
                const dbAchievements = apiResult.achievements;
                console.log(`✅ Database contains ${dbAchievements.length} achievements`);

                // Check if calculated values match database values
                let matchCount = 0;
                let totalChecked = 0;

                fixResult.results.forEach(calculated => {
                    const dbAchievement = dbAchievements.find(db => db.name === calculated.achievement);
                    if (dbAchievement) {
                        totalChecked++;
                        const dbPercentage = dbAchievement.progress_percentage || 0;
                        const calcPercentage = parseFloat(calculated.percentage);
                        
                        if (Math.abs(dbPercentage - calcPercentage) < 1) { // Allow 1% difference
                            matchCount++;
                        } else {
                            console.log(`⚠️  Mismatch: ${calculated.achievement} - DB: ${dbPercentage}%, Calc: ${calcPercentage}%`);
                        }
                    }
                });

                console.log(`✅ Database sync: ${matchCount}/${totalChecked} achievements match calculated values`);

                // Step 3: Test achievement categories
                console.log('\n🏷️  Step 3: Testing achievement categories...');
                const stats = apiResult.stats;
                console.log(`   Earned: ${stats.earned_achievements}`);
                console.log(`   Nutrition: ${stats.nutrition_badges}`);
                console.log(`   Consistency: ${stats.consistency_badges}`);
                console.log(`   Milestones: ${stats.milestone_badges}`);
                console.log(`   Total: ${stats.total_achievements}`);

                // Step 4: Test specific achievement types
                console.log('\n🎯 Step 4: Testing specific achievement types...');
                
                // Daily achievements
                const dailyCalorie = dbAchievements.find(a => a.name === 'Daily Calorie Goal');
                const dailyProtein = dbAchievements.find(a => a.name === 'Daily Protein Goal');
                const balancedDay = dbAchievements.find(a => a.name === 'Balanced Day');

                if (dailyCalorie) {
                    console.log(`   Daily Calorie: ${dailyCalorie.progress_percentage}% ${dailyCalorie.is_earned ? '🏆' : ''}`);
                }
                if (dailyProtein) {
                    console.log(`   Daily Protein: ${dailyProtein.progress_percentage}% ${dailyProtein.is_earned ? '🏆' : ''}`);
                }
                if (balancedDay) {
                    console.log(`   Balanced Day: ${balancedDay.progress_percentage}% ${balancedDay.is_earned ? '🏆' : ''}`);
                }

                // Milestone achievements
                const firstGoal = dbAchievements.find(a => a.name === 'First Goal');
                const centuryClub = dbAchievements.find(a => a.name === 'Century Club');

                if (firstGoal) {
                    console.log(`   First Goal: ${firstGoal.progress_percentage}% ${firstGoal.is_earned ? '🏆' : ''}`);
                }
                if (centuryClub) {
                    console.log(`   Century Club: ${centuryClub.progress_percentage}%`);
                }

                // Total progress achievements
                const proteinMaster = dbAchievements.find(a => a.name === 'Protein Master');
                const calorieCounter = dbAchievements.find(a => a.name === 'Calorie Counter');

                if (proteinMaster) {
                    console.log(`   Protein Master: ${proteinMaster.progress_percentage}%`);
                }
                if (calorieCounter) {
                    console.log(`   Calorie Counter: ${calorieCounter.progress_percentage}%`);
                }

                // Final assessment
                console.log('\n' + '=' .repeat(60));
                console.log('🎉 FINAL ASSESSMENT:');
                
                const workingAchievements = dbAchievements.filter(a => (a.progress_percentage || 0) > 0).length;
                const earnedAchievements = dbAchievements.filter(a => a.is_earned).length;
                
                console.log(`✅ Working achievements: ${workingAchievements}/${dbAchievements.length}`);
                console.log(`🏆 Earned achievements: ${earnedAchievements}/${dbAchievements.length}`);
                console.log(`💾 Database sync: ${matchCount}/${totalChecked} accurate`);

                if (workingAchievements >= 6 && matchCount >= totalChecked * 0.9) {
                    console.log('\n🎉 SUCCESS! Achievement system is working properly!');
                    console.log('   ✅ Calculation logic works');
                    console.log('   ✅ Database storage works');
                    console.log('   ✅ Multiple achievement types work');
                    console.log('   ✅ Progress tracking works');
                } else {
                    console.log('\n⚠️  PARTIAL SUCCESS - Some issues detected:');
                    if (workingAchievements < 6) {
                        console.log('   ❌ Too few achievements showing progress');
                    }
                    if (matchCount < totalChecked * 0.9) {
                        console.log('   ❌ Database sync issues detected');
                    }
                }

            } else {
                console.log(`❌ Database verification failed: ${apiResult.error}`);
            }

        } else {
            console.log(`❌ Calculation test failed: ${fixResult.error}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
    }
}

testFinalAchievements().catch(console.error);
