#!/usr/bin/env node
/**
 * Verify Achievement Fix
 * Quick verification that achievements are working
 */

async function verifyFix() {
    console.log('✅ VERIFYING ACHIEVEMENT FIX');
    console.log('=' .repeat(40));

    const USER_ID = 8; // Change this to your user ID

    try {
        console.log(`\n🔍 Checking User ${USER_ID}...`);

        // Step 1: Check current progress
        const progressResponse = await fetch(`http://localhost:3000/api/progress?user_id=${USER_ID}&date=${new Date().toISOString().split('T')[0]}`);
        
        if (!progressResponse.ok) {
            console.log('❌ Could not fetch progress data');
            return;
        }

        const progressResult = await progressResponse.json();
        
        if (!progressResult.success) {
            console.log('❌ Progress API failed');
            return;
        }

        const progress = progressResult.progress;
        console.log(`📊 Current Progress:`);
        console.log(`   Calories: ${progress.calories.consumed}/${progress.calories.goal} (${progress.calories.percentage.toFixed(1)}%)`);
        console.log(`   Protein: ${progress.protein.consumed}g/${progress.protein.goal}g (${progress.protein.percentage.toFixed(1)}%)`);

        if (progress.calories.consumed === 0 && progress.protein.consumed === 0) {
            console.log('\n⚠️  No meal data found for today. Log a meal first!');
            return;
        }

        // Step 2: Apply direct fix
        console.log(`\n🔧 Applying direct fix...`);
        const fixResponse = await fetch('http://localhost:3000/api/achievements/direct-fix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: USER_ID })
        });

        const fixResult = await fixResponse.json();
        
        if (fixResult.success) {
            console.log(`✅ Fix applied successfully:`);
            fixResult.results.forEach(result => {
                console.log(`   ${result.achievement}: ${result.percentage}`);
            });
        } else {
            console.log(`❌ Fix failed: ${fixResult.error}`);
            return;
        }

        // Step 3: Verify achievements
        console.log(`\n📋 Checking achievements...`);
        const achievementsResponse = await fetch(`http://localhost:3000/api/achievements?user_id=${USER_ID}`);
        const achievementsResult = await achievementsResponse.json();

        if (achievementsResult.success) {
            const dailyAchievements = achievementsResult.achievements.filter(a => 
                a.name.includes('Daily')
            );

            console.log(`🏆 Daily Achievements:`);
            dailyAchievements.forEach(achievement => {
                const progress = achievement.progress_percentage || 0;
                console.log(`   ${achievement.name}: ${progress.toFixed(1)}% ${progress > 0 ? '✅' : '❌'}`);
            });

            const workingCount = dailyAchievements.filter(a => (a.progress_percentage || 0) > 0).length;
            
            if (workingCount === dailyAchievements.length) {
                console.log(`\n🎉 SUCCESS! All ${workingCount} daily achievements are working!`);
                console.log(`\n💡 Now go to your achievements page and refresh to see the progress bars.`);
            } else {
                console.log(`\n⚠️  Only ${workingCount}/${dailyAchievements.length} achievements working. Try refreshing the achievements page.`);
            }

        } else {
            console.log(`❌ Could not fetch achievements: ${achievementsResult.error}`);
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        console.log('\n💡 Make sure:');
        console.log('   - Your Next.js server is running');
        console.log('   - You have logged meals today');
        console.log('   - The user ID is correct');
    }
}

verifyFix().catch(console.error);
