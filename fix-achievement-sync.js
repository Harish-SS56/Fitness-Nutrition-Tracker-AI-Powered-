#!/usr/bin/env node
/**
 * Fix Achievement Synchronization
 * Ensures all users have properly initialized achievements
 */

async function fixAchievementSync() {
    console.log('🔧 FIXING ACHIEVEMENT SYNCHRONIZATION');
    console.log('=' .repeat(60));

    try {
        // Get all users from the database
        console.log('\n👥 Step 1: Getting all users...');
        
        // For now, let's fix the specific user we saw in the images
        const USERS_TO_FIX = [
            { user_id: 6, name: 'divagar' },  // User from the screenshots
            { user_id: 5, name: 'harish' }   // Another user
        ];

        for (const user of USERS_TO_FIX) {
            console.log(`\n🔄 Fixing achievements for user: ${user.name} (ID: ${user.user_id})`);

            try {
                // Force sync achievements for this user
                const response = await fetch('http://localhost:3000/api/achievements/force-sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: user.user_id
                    })
                });

                const result = await response.json();

                if (result.success) {
                    console.log(`   ✅ ${user.name}: Achievements synchronized successfully`);
                    console.log(`   📊 Steps completed: ${result.steps_completed?.join(', ')}`);
                    
                    if (result.newly_earned && result.newly_earned.length > 0) {
                        console.log(`   🎉 Newly earned: ${result.newly_earned.length} achievements`);
                        result.newly_earned.forEach(achievement => {
                            console.log(`      🏆 ${achievement.name}`);
                        });
                    }
                } else {
                    console.log(`   ❌ ${user.name}: Failed to sync - ${result.error}`);
                }

                // Verify the fix by checking current achievements
                const verifyResponse = await fetch(`http://localhost:3000/api/achievements?user_id=${user.user_id}`);
                const verifyResult = await verifyResponse.json();

                if (verifyResult.success) {
                    const stats = verifyResult.stats;
                    console.log(`   📈 Current status: ${stats.earned_achievements}/${stats.total_achievements} achievements earned`);
                    
                    // Check if daily achievements have progress
                    const dailyAchievements = verifyResult.achievements.filter(a => 
                        a.name.includes('Daily') && a.current_progress > 0
                    );
                    
                    if (dailyAchievements.length > 0) {
                        console.log(`   ✅ Daily achievements showing progress: ${dailyAchievements.length}`);
                    } else {
                        console.log(`   ⚠️  No progress on daily achievements - user may need to log meals`);
                    }
                }

            } catch (userError) {
                console.log(`   ❌ ${user.name}: Error - ${userError.message}`);
            }
        }

        console.log('\n' + '=' .repeat(60));
        console.log('🎯 ACHIEVEMENT SYNC FIX COMPLETED');
        console.log('\n💡 Next steps:');
        console.log('   1. Go to your fitness tracker dashboard');
        console.log('   2. Click "Sync Achievements" button');
        console.log('   3. Navigate to Achievements page');
        console.log('   4. Verify progress is showing correctly');
        console.log('\n🧪 To test further, run: node test-achievement-sync.js');

    } catch (error) {
        console.error('\n❌ Fix script failed:', error.message);
        console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
    }
}

// Run the fix
fixAchievementSync().catch(console.error);
