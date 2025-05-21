import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def check_migrations():
    """Check existing migrations in Supabase"""
    if not DATABASE_URL:
        print("Error: DATABASE_URL not set in .env file")
        return
    
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        
        # Create a cursor
        cur = conn.cursor()
        
        # Check if the migrations table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'migrations'
            );
        """)
        
        migrations_table_exists = cur.fetchone()[0]
        
        if migrations_table_exists:
            # Get all migrations
            cur.execute("""
                SELECT id, name, applied_at
                FROM public.migrations
                ORDER BY applied_at;
            """)
            
            migrations = cur.fetchall()
            
            print("=== Existing Migrations ===")
            for migration in migrations:
                print(f"ID: {migration[0]}, Name: {migration[1]}, Applied at: {migration[2]}")
        else:
            print("No migrations table found in the database.")
            
            # Check for the rough_island migration
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'clients'
                );
            """)
            
            clients_table_exists = cur.fetchone()[0]
            
            if clients_table_exists:
                print("The 'clients' table exists, which suggests that the rough_island migration has been applied.")
            else:
                print("The 'clients' table does not exist, which suggests that no migrations have been applied.")
        
        # Close the cursor and connection
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error checking migrations: {str(e)}")

if __name__ == "__main__":
    check_migrations()
