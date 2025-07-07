import os
import httpx
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

async def test_connection():
    """Test connection to Supabase"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL or SUPABASE_ANON_KEY not set in .env file")
        return
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 200:
                print("✅ Successfully connected to Supabase!")
                print(f"Supabase URL: {SUPABASE_URL}")
            else:
                print(f"❌ Failed to connect to Supabase. Status code: {response.status_code}")
                print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_connection())
