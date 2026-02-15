#!/bin/bash

# HabitForge Docker Startup Script
# This script starts all services connecting to local MongoDB

set -e

PASSWORD="1912"
NETWORK="habitforge-network"

echo "🚀 Starting HabitForge Services..."

# Create network if it doesn't exist
echo "📡 Creating Docker network..."
echo "$PASSWORD" | sudo -S docker network create $NETWORK 2>/dev/null || echo "Network already exists"

# Start Redis if not running
echo "🔴 Starting Redis..."
if [ ! "$(echo "$PASSWORD" | sudo -S docker ps -q -f name=habitforge-redis)" ]; then
    if [ "$(echo "$PASSWORD" | sudo -S docker ps -aq -f name=habitforge-redis)" ]; then
        echo "$PASSWORD" | sudo -S docker rm habitforge-redis
    fi
    echo "$PASSWORD" | sudo -S docker run -d \
        --name habitforge-redis \
        --network $NETWORK \
        -p 6379:6379 \
        --restart unless-stopped \
        redis:7.0-alpine redis-server --appendonly yes --requirepass habitforge123
fi
echo "✅ Redis is running"

# Build and start User Service
echo "👤 Building User Service..."
echo "$PASSWORD" | sudo -S docker build -t habitforge-user-service ./user-service

if [ "$(echo "$PASSWORD" | sudo -S docker ps -aq -f name=habitforge-user-service)" ]; then
    echo "$PASSWORD" | sudo -S docker rm -f habitforge-user-service
fi

echo "$PASSWORD" | sudo -S docker run -d \
    --name habitforge-user-service \
    --network $NETWORK \
    -p 3001:3001 \
    --add-host=host.docker.internal:host-gateway \
    -e NODE_ENV=development \
    -e PORT=3001 \
    -e MONGODB_URI=mongodb://host.docker.internal:27017/habitforge \
    -e REDIS_HOST=habitforge-redis \
    -e REDIS_PORT=6379 \
    -e REDIS_PASSWORD=habitforge123 \
    -e JWT_SECRET=your-super-secret-jwt-key \
    -e JWT_EXPIRES_IN=15m \
    -e REFRESH_TOKEN_EXPIRES_IN=7d \
    -v "$(pwd)/user-service:/app" \
    -v /app/node_modules \
    --restart unless-stopped \
    habitforge-user-service npm run dev

echo "✅ User Service started"

# Build and start Habit Service
echo "🎯 Building Habit Service..."
echo "$PASSWORD" | sudo -S docker build -t habitforge-habit-service ./habit-service

if [ "$(echo "$PASSWORD" | sudo -S docker ps -aq -f name=habitforge-habit-service)" ]; then
    echo "$PASSWORD" | sudo -S docker rm -f habitforge-habit-service
fi

echo "$PASSWORD" | sudo -S docker run -d \
    --name habitforge-habit-service \
    --network $NETWORK \
    -p 3002:3002 \
    --add-host=host.docker.internal:host-gateway \
    -e NODE_ENV=development \
    -e PORT=3002 \
    -e MONGODB_URI=mongodb://host.docker.internal:27017/habitforge \
    -e REDIS_HOST=habitforge-redis \
    -e REDIS_PORT=6379 \
    -e REDIS_PASSWORD=habitforge123 \
    -e JWT_SECRET=your-super-secret-jwt-key \
    -e USER_SERVICE_URL=http://habitforge-user-service:3001 \
    -v "$(pwd)/habit-service:/app" \
    -v /app/node_modules \
    --restart unless-stopped \
    habitforge-habit-service npm run dev

echo "✅ Habit Service started"

# Build and start Club Service
echo "🏆 Building Club Service..."
echo "$PASSWORD" | sudo -S docker build -t habitforge-club-service ./club-service

if [ "$(echo "$PASSWORD" | sudo -S docker ps -aq -f name=habitforge-club-service)" ]; then
    echo "$PASSWORD" | sudo -S docker rm -f habitforge-club-service
fi

echo "$PASSWORD" | sudo -S docker run -d \
    --name habitforge-club-service \
    --network $NETWORK \
    -p 3003:3003 \
    --add-host=host.docker.internal:host-gateway \
    -e NODE_ENV=development \
    -e PORT=3003 \
    -e MONGODB_URI=mongodb://host.docker.internal:27017/habitforge \
    -e REDIS_HOST=habitforge-redis \
    -e REDIS_PORT=6379 \
    -e REDIS_PASSWORD=habitforge123 \
    -e USER_SERVICE_URL=http://habitforge-user-service:3001 \
    -e HABIT_SERVICE_URL=http://habitforge-habit-service:3002 \
    -v "$(pwd)/club-service:/app" \
    -v /app/node_modules \
    --restart unless-stopped \
    habitforge-club-service npm run dev

echo "✅ Club Service started"

# Build and start Analytics Service
echo "📊 Building Analytics Service..."
echo "$PASSWORD" | sudo -S docker build -t habitforge-analytics-service ./analytics-service

if [ "$(echo "$PASSWORD" | sudo -S docker ps -aq -f name=habitforge-analytics-service)" ]; then
    echo "$PASSWORD" | sudo -S docker rm -f habitforge-analytics-service
fi

echo "$PASSWORD" | sudo -S docker run -d \
    --name habitforge-analytics-service \
    --network $NETWORK \
    -p 3004:3004 \
    --add-host=host.docker.internal:host-gateway \
    -e NODE_ENV=development \
    -e PORT=3004 \
    -e MONGODB_URI=mongodb://host.docker.internal:27017/habitforge \
    -e REDIS_HOST=habitforge-redis \
    -e REDIS_PORT=6379 \
    -e REDIS_PASSWORD=habitforge123 \
    -e USER_SERVICE_URL=http://habitforge-user-service:3001 \
    -e HABIT_SERVICE_URL=http://habitforge-habit-service:3002 \
    -e CLUB_SERVICE_URL=http://habitforge-club-service:3003 \
    -v "$(pwd)/analytics-service:/app" \
    -v /app/node_modules \
    --restart unless-stopped \
    habitforge-analytics-service npm run dev

echo "✅ Analytics Service started"

# Build and start API Gateway
echo "🌐 Building API Gateway..."
echo "$PASSWORD" | sudo -S docker build -t habitforge-api-gateway ./api-gateway

if [ "$(echo "$PASSWORD" | sudo -S docker ps -aq -f name=habitforge-api-gateway)" ]; then
    echo "$PASSWORD" | sudo -S docker rm -f habitforge-api-gateway
fi

echo "$PASSWORD" | sudo -S docker run -d \
    --name habitforge-api-gateway \
    --network $NETWORK \
    -p 3000:3000 \
    -e NODE_ENV=development \
    -e PORT=3000 \
    -e JWT_SECRET=your-super-secret-jwt-key-change-in-production \
    -e REDIS_HOST=habitforge-redis \
    -e REDIS_PORT=6379 \
    -e REDIS_PASSWORD=habitforge123 \
    -e USER_SERVICE_URL=http://habitforge-user-service:3001 \
    -e HABIT_SERVICE_URL=http://habitforge-habit-service:3002 \
    -e CLUB_SERVICE_URL=http://habitforge-club-service:3003 \
    -e ANALYTICS_SERVICE_URL=http://habitforge-analytics-service:3004 \
    -v "$(pwd)/api-gateway:/app" \
    -v /app/node_modules \
    --restart unless-stopped \
    habitforge-api-gateway npm run dev

echo "✅ API Gateway started"

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📋 Service Status:"
echo "$PASSWORD" | sudo -S docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🔗 Services available at:"
echo "   - API Gateway: http://localhost:3000"
echo "   - User Service: http://localhost:3001"
echo "   - Habit Service: http://localhost:3002"
echo "   - Club Service: http://localhost:3003"
echo "   - Analytics Service: http://localhost:3004"
echo "   - Redis: localhost:6379"
echo "   - MongoDB: localhost:27017 (local)"
echo ""
echo "📝 To view logs: sudo docker logs -f <service-name>"
echo "🛑 To stop all: sudo docker stop habitforge-redis habitforge-user-service habitforge-habit-service habitforge-club-service habitforge-analytics-service habitforge-api-gateway"
