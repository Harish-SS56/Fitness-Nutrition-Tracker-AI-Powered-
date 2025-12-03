#!/usr/bin/env python3
"""
Simple database setup using SQL seed data
Use this if the CSV loading fails
"""

import os
import psycopg2

DATABASE_URL = os.environ.get('DATABASE_URL', 
    'postgresql://neondb_owner:npg_3UJsiurpcRG8@ep-solitary-mud-a8g7ry88-pooler.eastus2.azure.neon.tech/neondb?sslmode=require')

def setup_database_simple():
    """Setup database with SQL files"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("🗄️ Creating tables...")
        
        # Read and execute table creation
        with open('scripts/01-create-tables.sql', 'r') as f:
            cursor.execute(f.read())
        
        print("✅ Tables created!")
        
        print("🌱 Seeding nutrition data...")
        
        # Read and execute nutrition seed data
        with open('scripts/02-seed-nutrition.sql', 'r') as f:
            cursor.execute(f.read())
        
        conn.commit()
        
        # Verify
        cursor.execute("SELECT COUNT(*) FROM nutrition")
        count = cursor.fetchone()[0]
        print(f"✅ Loaded {count} nutrition records")
        
        # Show samples
        cursor.execute("SELECT name, enerc, protcnt FROM nutrition LIMIT 5")
        samples = cursor.fetchall()
        print("\n🔍 Sample foods:")
        for sample in samples:
            print(f"  - {sample[0]}: {sample[1]} kcal, {sample[2]}g protein")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Simple database setup completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    setup_database_simple()
