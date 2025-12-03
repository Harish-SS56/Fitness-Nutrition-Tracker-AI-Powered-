#!/usr/bin/env node
/**
 * Test All Achievements
 * Verify that all achievement types are working
 */

async function testAllAchievements() {
    console.log('🏆 TESTING ALL ACHIEVEMENT TYPES');
    console.log('=' .repeat(60));

    try {
        // Find a user with meal data
        const debugResponse = await fetch('http://localhost:3000/api/achievements/debug-display');
        const debugResult = await debugResponse.json();

        if (!debugResult.success || debugResult.debug_data.length === 0) {
            console.log('❌ No users found with meal data');
            return;
        }

        const user = debugResult.debug_data[0];
        console.log(`\n🔍 Testing for user: ${user.name} (ID: ${user.user_id})`);
        console.log(`📊 Meal data: ${user.meal_data.calories}, ${user.meal_data.protein}`);

        // Apply comprehensive fix
        console.log('\n🔧 Applying comprehensive achievement fix...');
        const fixResponse = await fetch('http://localhost:3000/api/achievements/direct-fix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.user_id })
        });

        const fixResult = await fixResponse.json();

        if (fixResult.success) {
            console.log(`✅ Comprehensive fix completed for ${fixResult.user_data.name}`);
            
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

            // Display results by category
            Object.keys(categories).forEach(category => {
                if (categories[category].length > 0) {
                    console.log(`\n🏷️  ${category.toUpperCase()} ACHIEVEMENTS:`);
                    categories[category].forEach(achievement => {
                        const status = achievement.earned ? '🏆 EARNED' : 
                                     parseFloat(achievement.percentage) > 0 ? '📈 PROGRESS' : '⭕ NO PROGRESS';
                        console.log(`   ${achievement.achievement}: ${achievement.percentage} ${status}`);
                    });
                }
            });

            // Summary
            const totalAchievements = fixResult.results.length;
            const earnedAchievements = fixResult.results.filter(r => r.earned).length;
            const progressAchievements = fixResult.results.filter(r => !r.earned && parseFloat(r.percentage) > 0).length;
            const noProgressAchievements = fixResult.results.filter(r => !r.earned && parseFloat(r.percentage) === 0).length;

            console.log('\n' + '=' .repeat(60));
            console.log('📊 ACHIEVEMENT SUMMARY:');
            console.log(`   🏆 Earned: ${earnedAchievements}/${totalAchievements}`);
            console.log(`   📈 In Progress: ${progressAchievements}/${totalAchievements}`);
            console.log(`   ⭕ No Progress: ${noProgressAchievements}/${totalAchievements}`);

            if (progressAchievements + earnedAchievements > 2) {
                console.log('\n🎉 SUCCESS! Multiple achievement types are now working!');
                console.log('\n💡 Go to your achievements page to see all the progress bars updated.');
            } else {
                console.log('\n⚠️  Only daily achievements seem to be working. Check the calculations.');
            }

        } else {
            console.log(`❌ Fix failed: ${fixResult.error}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
    }
}

testAllAchievements().catch(console.error);
