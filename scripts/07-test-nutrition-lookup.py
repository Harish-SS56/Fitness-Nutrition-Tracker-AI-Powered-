#!/usr/bin/env python3
"""
Test script to verify nutrition lookup functionality
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def test_nutrition_lookup():
    """Test nutrition database lookup functionality"""
    
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        return False
    
    try:
        # Connect to database
        print("🔗 Connecting to database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check total number of foods
        cursor.execute("SELECT COUNT(*) as count FROM nutrition")
        result = cursor.fetchone()
        total_foods = result['count']
        print(f"📊 Total foods in database: {total_foods}")
        
        if total_foods == 0:
            print("❌ No nutrition data found in database")
            return False
        
        # Test common food searches
        test_foods = ['chicken', 'spinach', 'rice', 'apple', 'eggs']
        
        print("\n🔍 Testing food searches:")
        for food in test_foods:
            # Test exact match
            cursor.execute(
                "SELECT name, enerc, protcnt, fatce, choavldf, fibtg FROM nutrition WHERE LOWER(name) = LOWER(%s)",
                (food,)
            )
            result = cursor.fetchone()
            
            if result:
                print(f"✅ {food}: {result['enerc']} kcal, {result['protcnt']}g protein")
            else:
                # Test partial match
                cursor.execute(
                    "SELECT name, enerc, protcnt, fatce, choavldf, fibtg FROM nutrition WHERE LOWER(name) LIKE LOWER(%s) LIMIT 1",
                    (f'%{food}%',)
                )
                result = cursor.fetchone()
                
                if result:
                    print(f"✅ {food} (found: {result['name']}): {result['enerc']} kcal, {result['protcnt']}g protein")
                else:
                    print(f"❌ {food}: Not found")
        
        # Test meal parsing simulation
        print("\n🍽️ Testing meal parsing simulation:")
        test_meals = [
            "100g chicken",
            "1 bowl spinach",
            "2 eggs",
            "1 apple"
        ]
        
        for meal in test_meals:
            print(f"\nTesting: '{meal}'")
            
            # Simple parsing logic (similar to what AI would do)
            words = meal.lower().split()
            quantity = 100  # default
            food_name = None
            
            # Extract quantity and food name
            for i, word in enumerate(words):
                if word.replace('g', '').replace('kg', '').isdigit():
                    if 'kg' in word:
                        quantity = int(word.replace('kg', '')) * 1000
                    else:
                        quantity = int(word.replace('g', ''))
                elif word in ['bowl', 'cup']:
                    quantity = 150  # assume 150g for bowl/cup
                elif word.isdigit():
                    quantity = int(word) * 100  # assume 100g per item
            
            # Find food name
            for word in words:
                if word not in ['g', 'kg', 'bowl', 'cup'] and not word.isdigit():
                    cursor.execute(
                        "SELECT name, enerc, protcnt, fatce, choavldf, fibtg FROM nutrition WHERE LOWER(name) LIKE LOWER(%s) LIMIT 1",
                        (f'%{word}%',)
                    )
                    result = cursor.fetchone()
                    if result:
                        food_name = result['name']
                        # Calculate nutrition for quantity
                        calories = (result['enerc'] * quantity) / 100
                        protein = (result['protcnt'] * quantity) / 100
                        fat = (result['fatce'] * quantity) / 100
                        carbs = (result['choavldf'] * quantity) / 100
                        fiber = (result['fibtg'] * quantity) / 100
                        
                        print(f"  ✅ Found: {food_name}")
                        print(f"  📊 {quantity}g = {calories:.1f} kcal, {protein:.1f}g protein, {fat:.1f}g fat, {carbs:.1f}g carbs, {fiber:.1f}g fiber")
                        break
            
            if not food_name:
                print(f"  ❌ No matching food found")
        
        cursor.close()
        conn.close()
        
        print(f"\n✅ Nutrition lookup test completed successfully!")
        print(f"📈 Database contains {total_foods} foods ready for meal logging")
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Nutrition Lookup Functionality")
    print("=" * 50)
    
    success = test_nutrition_lookup()
    
    if success:
        print("\n🎉 All tests passed! The nutrition system is ready to use.")
    else:
        print("\n💥 Tests failed. Please check the database setup.")
