import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def test_connection():
    """Test connection to PostgreSQL database"""
    if not DATABASE_URL:
        print("Error: DATABASE_URL not set in .env file")
        return
    
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        
        # Create a cursor
        cur = conn.cursor()
        
        # Execute a simple query
        cur.execute("SELECT version();")
        
        # Fetch the result
        version = cur.fetchone()
        
        print("✅ Successfully connected to PostgreSQL!")
        print(f"PostgreSQL version: {version[0]}")
        
        # Close the cursor and connection
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error connecting to PostgreSQL: {str(e)}")

if __name__ == "__main__":
    test_connection()
