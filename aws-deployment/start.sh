#!/bin/bash

# BebeClick Startup Script
echo "🚀 Starting BebeClick Delivery Calculator..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Set environment
export NODE_ENV=production
export PORT=${PORT:-3001}

# Start server
echo "🌐 Starting server on port $PORT..."
node server.js
