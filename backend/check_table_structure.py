import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def check_table_structure():
    """Check the structure of existing tables in Supabase"""
    if not DATABASE_URL:
        print("Error: DATABASE_URL not set in .env file")
        return
    
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        
        # Create a cursor
        cur = conn.cursor()
        
        # Get all tables in the public schema
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cur.fetchall()
        
        print("=== Tables in public schema ===")
        for table in tables:
            table_name = table[0]
            print(f"\nTable: {table_name}")
            
            # Get columns for this table
            cur.execute(f"""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = '{table_name}'
                ORDER BY ordinal_position;
            """)
            
            columns = cur.fetchall()
            
            print("Columns:")
            for column in columns:
                nullable = "NULL" if column[2] == "YES" else "NOT NULL"
                default = f" DEFAULT {column[3]}" if column[3] else ""
                print(f"  - {column[0]}: {column[1]} {nullable}{default}")
            
            # Get foreign keys for this table
            cur.execute(f"""
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM
                    information_schema.table_constraints AS tc
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='{table_name}';
            """)
            
            foreign_keys = cur.fetchall()
            
            if foreign_keys:
                print("Foreign Keys:")
                for fk in foreign_keys:
                    print(f"  - {fk[0]} REFERENCES {fk[1]}({fk[2]})")
        
        # Close the cursor and connection
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error checking table structure: {str(e)}")

if __name__ == "__main__":
    check_table_structure()
