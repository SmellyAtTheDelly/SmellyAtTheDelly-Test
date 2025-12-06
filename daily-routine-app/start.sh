#!/bin/bash

echo "🚀 Starting Daily Routine App..."
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd server
    npm install
    cd ..
fi

# Start the server
echo "✨ Starting server..."
echo "📱 Open http://localhost:3000 in your browser"
echo ""

cd server
npm start
