#!/bin/bash

# Make the script executable
chmod +x setup-and-start.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up I-Invoyisi with Gemini API integration...${NC}"

# Install server dependencies
echo -e "${GREEN}Installing server dependencies...${NC}"
cd server
npm install
cd ..

# Install frontend dependencies if needed
echo -e "${GREEN}Checking frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies...${NC}"
  npm install
fi

# Create a .env file for environment variables if it doesn't exist
if [ ! -f ".env" ]; then
  echo -e "${GREEN}Creating .env file...${NC}"
  echo "REACT_APP_SUPABASE_URL=your_supabase_url" > .env
  echo "REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env
  echo "GEMINI_API_KEY=AIzaSyA_3mbL9O1DXOCf0VuZHxAxi9oRrpUwqFg" >> .env
  echo -e "${YELLOW}Please update the .env file with your Supabase credentials${NC}"
fi

# Start both servers
echo -e "${GREEN}Starting servers...${NC}"
echo -e "${YELLOW}Starting backend server...${NC}"
cd server
npm run dev &
SERVER_PID=$!
cd ..

echo -e "${YELLOW}Starting frontend development server...${NC}"
npm start &
FRONTEND_PID=$!

# Function to handle script termination
function cleanup {
  echo -e "${YELLOW}Stopping servers...${NC}"
  kill $SERVER_PID
  kill $FRONTEND_PID
  echo -e "${GREEN}Servers stopped.${NC}"
  exit
}

# Register the cleanup function for script termination
trap cleanup SIGINT SIGTERM

# Keep the script running
echo -e "${GREEN}Both servers are running. Press Ctrl+C to stop.${NC}"
wait
