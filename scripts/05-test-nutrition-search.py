import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection string
DATABASE_URL = "postgresql://neondb_owner:npg_3UJsiurpcRG8@ep-solitary-mud-a8g7ry88-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require"

def test_nutrition_search():
    """Test nutrition search functionality with common food items"""
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("Testing nutrition search functionality...\n")
        
        # Test searches for common foods
        test_queries = [
            "chicken",
            "rice", 
            "egg",
            "milk",
            "bread",
            "fish",
            "potato",
            "tomato"
        ]
        
        for query in test_queries:
            print(f"Searching for '{query}':")
            
            # Search query similar to what the API uses
            search_sql = """
            SELECT name, enerc, protcnt, fatce, choavldf, fibtg
            FROM nutrition 
            WHERE name ILIKE %s 
            ORDER BY 
                CASE WHEN name ILIKE %s THEN 1 ELSE 2 END,
                LENGTH(name),
                name
            LIMIT 5
            """
            
            cursor.execute(search_sql, (f'%{query}%', f'{query}%'))
            results = cursor.fetchall()
            
            if results:
                for result in results:
                    print(f"  - {result['name']}: {result['enerc']} kcal, {result['protcnt']}g protein")
            else:
                print(f"  No results found for '{query}'")
            print()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) as total FROM nutrition")
        total = cursor.fetchone()['total']
        print(f"Total nutrition records in database: {total}")
        
    except Exception as e:
        print(f"Error testing nutrition search: {e}")
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    test_nutrition_search()
