#!/usr/bin/env python3
"""
Complete database setup script for fitness tracker
This script will:
1. Create all necessary tables
2. Load nutrition data from CSV
3. Verify the setup
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
import csv
import io

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL', 
    'postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require')

CSV_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rawfood_nutrition-6LCNJjE9LlRmYLSWplUkIrJh92juYV.csv"

def create_tables():
    """Create all database tables"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("🗄️ Creating database tables...")
        
        # Drop existing tables to ensure clean setup
        cursor.execute("DROP TABLE IF EXISTS recommendations CASCADE")
        cursor.execute("DROP TABLE IF EXISTS meals CASCADE") 
        cursor.execute("DROP TABLE IF EXISTS nutrition CASCADE")
        cursor.execute("DROP TABLE IF EXISTS users CASCADE")
        
        # Create tables with correct schema
        create_tables_sql = """
        -- Users table for storing user profiles and goals
        CREATE TABLE users (
          user_id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          height DOUBLE PRECISION NOT NULL,
          weight DOUBLE PRECISION NOT NULL,
          bmi DOUBLE PRECISION,
          bmi_category TEXT,
          goal_type TEXT CHECK (goal_type IN ('maintenance', 'gain', 'loss')),
          calorie_goal DOUBLE PRECISION,
          protein_goal DOUBLE PRECISION,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Nutrition database table for food items
        CREATE TABLE nutrition (
          food_id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          enerc DOUBLE PRECISION DEFAULT 0, -- kcal per 100g
          protcnt DOUBLE PRECISION DEFAULT 0, -- g protein per 100g
          fatce DOUBLE PRECISION DEFAULT 0, -- g fat per 100g
          choavldf DOUBLE PRECISION DEFAULT 0, -- g available carbs per 100g
          fibtg DOUBLE PRECISION DEFAULT 0, -- g fiber per 100g
          water DOUBLE PRECISION DEFAULT 0 -- g water per 100g
        );

        -- Meals table for logging user meals
        CREATE TABLE meals (
          meal_id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
          meal_text TEXT NOT NULL,
          calories DOUBLE PRECISION,
          protein DOUBLE PRECISION,
          fat DOUBLE PRECISION,
          carbs DOUBLE PRECISION,
          fiber DOUBLE PRECISION,
          meal_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Recommendations table for AI-generated suggestions
        CREATE TABLE recommendations (
          recommendation_id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
          recommendation_text TEXT NOT NULL,
          recommendation_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX idx_meals_user_date ON meals(user_id, meal_date);
        CREATE INDEX idx_recommendations_user_date ON recommendations(user_id, recommendation_date);
        CREATE INDEX idx_nutrition_name ON nutrition(name);
        """
        
        cursor.execute(create_tables_sql)
        conn.commit()
        
        print("✅ Database tables created successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

def clean_numeric_value(value):
    """Clean and convert numeric values from CSV"""
    if not value or value == '' or value == '0' or str(value).lower() == 'na':
        return 0.0
    try:
        # Remove any non-numeric characters except decimal point
        cleaned = ''.join(c for c in str(value) if c.isdigit() or c == '.' or c == '-')
        return float(cleaned) if cleaned else 0.0
    except (ValueError, TypeError):
        return 0.0

def load_nutrition_data():
    """Load nutrition data from CSV file"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("🌐 Fetching nutrition data from CSV...")
        response = requests.get(CSV_URL)
        response.raise_for_status()
        
        # Parse CSV data
        csv_content = io.StringIO(response.text)
        csv_reader = csv.DictReader(csv_content)
        
        # Check what columns are available
        fieldnames = csv_reader.fieldnames
        print(f"📊 CSV columns found: {fieldnames}")
        
        insert_query = """
        INSERT INTO nutrition (name, enerc, protcnt, fatce, choavldf, fibtg, water)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (name) DO NOTHING
        """
        
        inserted_count = 0
        skipped_count = 0
        
        for row in csv_reader:
            try:
                # Extract and clean data
                name = row.get('name', '').strip()
                if not name:
                    skipped_count += 1
                    continue
                
                # Handle different possible column names
                enerc = clean_numeric_value(row.get('enerc', row.get('energy', row.get('calories', 0))))
                protcnt = clean_numeric_value(row.get('protcnt', row.get('protein', 0)))
                fatce = clean_numeric_value(row.get('fatce', row.get('fat', 0)))
                choavldf = clean_numeric_value(row.get('choavldf', row.get('carbs', row.get('carbohydrates', 0))))
                fibtg = clean_numeric_value(row.get('fibtg', row.get('fiber', row.get('fibre', 0))))
                water = clean_numeric_value(row.get('water', 0))
                
                # Insert the record
                cursor.execute(insert_query, (name, enerc, protcnt, fatce, choavldf, fibtg, water))
                inserted_count += 1
                
                if inserted_count % 100 == 0:
                    print(f"📈 Processed {inserted_count} records...")
                    
            except Exception as e:
                print(f"⚠️ Error processing row {name}: {e}")
                skipped_count += 1
                continue
        
        # Commit the transaction
        conn.commit()
        
        # Get final count
        cursor.execute("SELECT COUNT(*) FROM nutrition")
        total_count = cursor.fetchone()[0]
        
        print(f"✅ Successfully loaded {inserted_count} nutrition records")
        print(f"⚠️ Skipped {skipped_count} invalid records")
        print(f"📊 Total records in database: {total_count}")
        
        # Test some sample queries
        cursor.execute("SELECT name, enerc, protcnt FROM nutrition WHERE name ILIKE '%chicken%' LIMIT 3")
        samples = cursor.fetchall()
        if samples:
            print("\n🔍 Sample entries found:")
            for sample in samples:
                print(f"  - {sample[0]}: {sample[1]} kcal, {sample[2]}g protein")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error loading nutrition data: {e}")
        return False

def verify_setup():
    """Verify that everything is working correctly"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("\n🔍 Verifying database setup...")
        
        # Check tables exist
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tables = [row['table_name'] for row in cursor.fetchall()]
        print(f"📋 Tables found: {tables}")
        
        # Check nutrition data
        cursor.execute("SELECT COUNT(*) as count FROM nutrition")
        nutrition_count = cursor.fetchone()['count']
        print(f"🥗 Nutrition records: {nutrition_count}")
        
        # Test search functionality
        cursor.execute("SELECT name, enerc, protcnt FROM nutrition WHERE name ILIKE '%rice%' LIMIT 3")
        rice_samples = cursor.fetchall()
        if rice_samples:
            print("🍚 Rice samples found:")
            for sample in rice_samples:
                print(f"  - {sample['name']}: {sample['enerc']} kcal, {sample['protcnt']}g protein")
        
        cursor.close()
        conn.close()
        
        print("✅ Database setup verification completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Starting complete database setup for Fitness Tracker")
    print("=" * 60)
    
    # Step 1: Create tables
    if not create_tables():
        print("❌ Failed to create tables. Exiting.")
        return
    
    # Step 2: Load nutrition data
    if not load_nutrition_data():
        print("❌ Failed to load nutrition data. Exiting.")
        return
    
    # Step 3: Verify setup
    if not verify_setup():
        print("❌ Setup verification failed.")
        return
    
    print("\n🎉 Database setup completed successfully!")
    print("🚀 You can now run: pnpm dev")

if __name__ == "__main__":
    main()
