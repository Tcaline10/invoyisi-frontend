import os
import httpx
import asyncio
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

async def check_tables():
    """Check existing tables in Supabase"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL or SUPABASE_ANON_KEY not set in .env file")
        return
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Query to get table information
    query = """
    SELECT 
        table_schema, 
        table_name, 
        column_name, 
        data_type, 
        is_nullable
    FROM 
        information_schema.columns
    WHERE 
        table_schema IN ('public', 'auth')
    ORDER BY 
        table_schema, 
        table_name, 
        ordinal_position;
    """
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/execute_sql",
                headers=headers,
                json={"query": query, "params": []}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Group by table
                tables = {}
                for row in data:
                    schema = row['table_schema']
                    table = row['table_name']
                    key = f"{schema}.{table}"
                    
                    if key not in tables:
                        tables[key] = []
                    
                    tables[key].append({
                        'column': row['column_name'],
                        'type': row['data_type'],
                        'nullable': row['is_nullable']
                    })
                
                # Print table information
                print("=== Supabase Tables ===")
                for table_name, columns in tables.items():
                    print(f"\n{table_name}:")
                    for col in columns:
                        nullable = "NULL" if col['nullable'] == "YES" else "NOT NULL"
                        print(f"  - {col['column']}: {col['type']} {nullable}")
            else:
                print(f"❌ Failed to query tables. Status code: {response.status_code}")
                print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error querying tables: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_tables())
