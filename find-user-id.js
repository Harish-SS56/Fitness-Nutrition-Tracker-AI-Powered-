#!/usr/bin/env node
/**
 * Find the correct user ID from the dashboard
 */

async function findUserId() {
    console.log('🔍 FINDING CORRECT USER ID');
    console.log('=' .repeat(40));

    try {
        // Test different user IDs to find the right one
        const testUserIds = [1, 5, 6, 8, 9, 10];

        for (const userId of testUserIds) {
            try {
                const response = await fetch(`http://localhost:3000/api/achievements/debug?user_id=${userId}`);
                const result = await response.json();

                if (result.success && result.debug_info.user_exists) {
                    const user = result.debug_info.user_data;
                    const totals = result.debug_info.today_totals;
                    
                    console.log(`\n✅ User ${userId}: ${user.name}`);
                    console.log(`   Goals: ${user.calorie_goal} cal, ${user.protein_goal}g protein`);
                    console.log(`   Today: ${totals.total_calories} cal, ${totals.total_protein}g protein`);
                    
                    if (totals.total_calories > 0 || totals.total_protein > 0) {
                        console.log(`   🎯 THIS USER HAS MEAL DATA - USE ID ${userId}`);
                    }
                }
            } catch (error) {
                // Skip this user ID
            }
        }

        console.log('\n💡 Use the user ID that shows meal data for testing');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

findUserId().catch(console.error);
