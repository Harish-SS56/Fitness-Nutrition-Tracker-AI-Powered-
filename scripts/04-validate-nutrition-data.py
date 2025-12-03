import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection string
DATABASE_URL = "postgresql://neondb_owner:npg_3UJsiurpcRG8@ep-solitary-mud-a8g7ry88-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require"

def validate_nutrition_data():
    """Validate the loaded nutrition data and show statistics"""
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("=== Nutrition Database Validation ===\n")
        
        # Basic statistics
        cursor.execute("SELECT COUNT(*) as total FROM nutrition")
        total = cursor.fetchone()['total']
        print(f"Total food items: {total}")
        
        # Check for empty values
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN enerc = 0 THEN 1 ELSE 0 END) as zero_calories,
                SUM(CASE WHEN protcnt = 0 THEN 1 ELSE 0 END) as zero_protein,
                AVG(enerc) as avg_calories,
                AVG(protcnt) as avg_protein,
                MAX(enerc) as max_calories,
                MIN(enerc) as min_calories
            FROM nutrition
        """)
        
        stats = cursor.fetchone()
        print(f"Zero calorie entries: {stats['zero_calories']}")
        print(f"Zero protein entries: {stats['zero_protein']}")
        print(f"Average calories per 100g: {stats['avg_calories']:.1f}")
        print(f"Average protein per 100g: {stats['avg_protein']:.1f}")
        print(f"Highest calorie food: {stats['max_calories']:.1f} kcal/100g")
        print(f"Lowest calorie food: {stats['min_calories']:.1f} kcal/100g")
        
        # Show top protein sources
        print("\n=== Top 10 Protein Sources ===")
        cursor.execute("""
            SELECT name, protcnt, enerc 
            FROM nutrition 
            WHERE protcnt > 0 
            ORDER BY protcnt DESC 
            LIMIT 10
        """)
        
        for row in cursor.fetchall():
            print(f"{row['name']}: {row['protcnt']:.1f}g protein, {row['enerc']:.1f} kcal")
        
        # Show sample foods for verification
        print("\n=== Sample Food Items ===")
        cursor.execute("""
            SELECT name, enerc, protcnt, fatce, choavldf 
            FROM nutrition 
            WHERE enerc > 0 
            ORDER BY RANDOM() 
            LIMIT 5
        """)
        
        for row in cursor.fetchall():
            print(f"{row['name']}: {row['enerc']:.1f} kcal, {row['protcnt']:.1f}g protein, {row['fatce']:.1f}g fat, {row['choavldf']:.1f}g carbs")
        
        print("\n=== Validation Complete ===")
        
    except Exception as e:
        print(f"Error validating data: {e}")
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    validate_nutrition_data()
