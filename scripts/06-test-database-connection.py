import psycopg2
import os

def test_database_connection():
    """Test database connection and check nutrition table"""
    
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable not set")
        return False
    
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("✅ Database connection successful")
        
        # Check if nutrition table exists and has data
        cursor.execute("SELECT COUNT(*) FROM nutrition")
        count = cursor.fetchone()[0]
        print(f"📊 Nutrition table has {count} records")
        
        if count == 0:
            print("⚠️  Nutrition table is empty - need to load CSV data")
            return False
        
        # Test search for common foods
        test_foods = ['chicken', 'spinach', 'rice', 'egg']
        
        for food in test_foods:
            cursor.execute(
                "SELECT name, enerc, protcnt FROM nutrition WHERE name ILIKE %s LIMIT 3",
                (f'%{food}%',)
            )
            results = cursor.fetchall()
            
            if results:
                print(f"✅ Found {len(results)} matches for '{food}':")
                for result in results:
                    print(f"   - {result[0]}: {result[1]} kcal, {result[2]}g protein")
            else:
                print(f"❌ No matches found for '{food}'")
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    test_database_connection()
