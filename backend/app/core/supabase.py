from supabase import create_client, Client
from app.core.config import settings

# Create a Supabase client using the official Python client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
