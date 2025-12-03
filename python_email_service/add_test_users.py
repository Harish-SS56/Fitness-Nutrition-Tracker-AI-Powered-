#!/usr/bin/env python3
"""
Add Test Users to Database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection
DATABASE_URL = "postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

def add_test_users():
    """Add test users to database if they don't exist"""
    print("👥 ADDING TEST USERS")
    print("=" * 50)
    
    test_users = [
        {
            'name': 'Harini',
            'email': 'hk6113367@gmail.com',
            'height': 165.0,
            'weight': 55.0,
            'bmi': 20.2,
            'bmi_category': 'Normal',
            'goal_type': 'maintenance',
            'calorie_goal': 1358,
            'protein_goal': 180,
            'password_hash': '$2b$10$example_hash_for_harini'
        },
        {
            'name': 'Harish S.S.',
            'email': 'harishdeepikassdeepikass@gmail.com',
            'height': 175.0,
            'weight': 70.0,
            'bmi': 22.9,
            'bmi_category': 'Normal',
            'goal_type': 'gain',
            'calorie_goal': 2356,
            'protein_goal': 180,
            'password_hash': '$2b$10$example_hash_for_harish'
        }
    ]
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        for user_data in test_users:
            # Check if user already exists
            cursor.execute("""
                SELECT user_id FROM users WHERE email = %s
            """, (user_data['email'],))
            
            existing_user = cursor.fetchone()
            
            if existing_user:
                print(f"✅ User {user_data['name']} already exists (ID: {existing_user['user_id']})")
                
                # Update their email to make sure it's correct
                cursor.execute("""
                    UPDATE users 
                    SET email = %s, calorie_goal = %s, protein_goal = %s
                    WHERE user_id = %s
                """, (user_data['email'], user_data['calorie_goal'], user_data['protein_goal'], existing_user['user_id']))
                
                print(f"   📧 Updated email and goals for {user_data['name']}")
                
            else:
                # Insert new user
                cursor.execute("""
                    INSERT INTO users (name, email, password_hash, height, weight, bmi, bmi_category, goal_type, calorie_goal, protein_goal)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING user_id
                """, (
                    user_data['name'],
                    user_data['email'],
                    user_data['password_hash'],
                    user_data['height'],
                    user_data['weight'],
                    user_data['bmi'],
                    user_data['bmi_category'],
                    user_data['goal_type'],
                    user_data['calorie_goal'],
                    user_data['protein_goal']
                ))
                
                new_user = cursor.fetchone()
                print(f"✅ Created new user {user_data['name']} (ID: {new_user['user_id']})")
        
        # Commit changes
        conn.commit()
        
        # Verify users exist
        print(f"\n🔍 Verifying users...")
        cursor.execute("""
            SELECT user_id, name, email, calorie_goal, protein_goal
            FROM users 
            WHERE email IN (%s, %s)
            ORDER BY user_id
        """, ('hk6113367@gmail.com', 'harishdeepikassdeepikass@gmail.com'))
        
        users = cursor.fetchall()
        print(f"   Found {len(users)} users:")
        
        for user in users:
            print(f"   📧 ID: {user['user_id']}, Name: {user['name']}, Email: {user['email']}")
            print(f"      Goals: {user['calorie_goal']}cal, {user['protein_goal']}g protein")
        
        cursor.close()
        conn.close()
        
        print(f"\n✅ SUCCESS: Test users are ready!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    add_test_users()
