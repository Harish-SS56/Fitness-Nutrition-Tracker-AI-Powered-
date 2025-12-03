import csv
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import requests
import io

DATABASE_URL = os.environ.get('DATABASE_URL')

CSV_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rawfood_nutrition-6LCNJjE9LlRmYLSWplUkIrJh92juYV.csv"

def clean_numeric_value(value):
    """Clean and convert numeric values from CSV"""
    if not value or value == '' or value == '0':
        return 0.0
    try:
        # Remove any non-numeric characters except decimal point
        cleaned = ''.join(c for c in str(value) if c.isdigit() or c == '.')
        return float(cleaned) if cleaned else 0.0
    except (ValueError, TypeError):
        return 0.0

def load_nutrition_data():
    """Load nutrition data from the real CSV file into the database"""
    
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        
        # Clear existing nutrition data
        cursor.execute("DELETE FROM nutrition")
        print("Cleared existing nutrition data")
        
        print(f"Fetching CSV data from: {CSV_URL}")
        response = requests.get(CSV_URL)
        response.raise_for_status()
        
        # Parse CSV data
        csv_content = io.StringIO(response.text)
        csv_reader = csv.DictReader(csv_content)
        
        insert_query = """
        INSERT INTO nutrition (name, enerc, protcnt, fatce, choavldf, fibtg, water)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (name) DO NOTHING
        """
        
        inserted_count = 0
        skipped_count = 0
        
        for row in csv_reader:
            try:
                # Extract and clean data using the actual CSV column names
                name = row.get('name', '').strip()
                if not name:
                    skipped_count += 1
                    continue
                
                enerc = clean_numeric_value(row.get('enerc', 0))  # Energy (kcal per 100g)
                protcnt = clean_numeric_value(row.get('protcnt', 0))  # Protein (g per 100g)
                fatce = clean_numeric_value(row.get('fatce', 0))  # Fat (g per 100g)
                choavldf = clean_numeric_value(row.get('choavldf', 0))  # Available carbs (g per 100g)
                fibtg = clean_numeric_value(row.get('fibtg', 0))  # Total dietary fiber (g per 100g)
                water = clean_numeric_value(row.get('water', 0))  # Water content (g per 100g)
                
                # Insert the record
                cursor.execute(insert_query, (name, enerc, protcnt, fatce, choavldf, fibtg, water))
                inserted_count += 1
                
                if inserted_count % 100 == 0:
                    print(f"Processed {inserted_count} records...")
                    
            except Exception as e:
                print(f"Error processing row {row.get('name', 'unknown')}: {e}")
                skipped_count += 1
                continue
        
        # Commit the transaction
        conn.commit()
        
        # Get final count
        cursor.execute("SELECT COUNT(*) FROM nutrition")
        total_count = cursor.fetchone()[0]
        
        print(f"Successfully loaded {inserted_count} nutrition records")
        print(f"Skipped {skipped_count} invalid records")
        print(f"Total records in database: {total_count}")
        
        cursor.execute("SELECT name, enerc, protcnt FROM nutrition WHERE name ILIKE '%chicken%' LIMIT 5")
        chicken_samples = cursor.fetchall()
        if chicken_samples:
            print("\nSample chicken entries found:")
            for sample in chicken_samples:
                print(f"  - {sample[0]}: {sample[1]} kcal, {sample[2]}g protein")
        
    except Exception as e:
        print(f"Error loading nutrition data: {e}")
        if conn:
            conn.rollback()
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    load_nutrition_data()
