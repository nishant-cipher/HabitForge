# Testing the Habit & Gamification Service

This guide walks you through testing the complete habit tracking and gamification flow.

## Prerequisites

1. MongoDB and Redis running via Docker Compose
2. API Gateway running on port 3000
3. User Service running on port 3001
4. Habit Service running on port 3002

## Setup

```bash
# Start infrastructure
docker-compose up -d mongodb redis

# Terminal 1 - API Gateway
cd api-gateway && npm install && npm run dev

# Terminal 2 - User Service
cd user-service && npm install && npm run dev

# Terminal 3 - Habit Service
cd habit-service && npm install && npm run dev
```

## Test Flow

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "mode": "BALANCED"
  }'
```

Save the `accessToken` from the response.

### 2. Create a Habit

```bash
curl -X POST http://localhost:3000/api/habits \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Exercise",
    "description": "30 minutes of cardio",
    "category": "HEALTH",
    "difficulty": 3,
    "frequency": "DAILY"
  }'
```

Save the `_id` from the response as `HABIT_ID`.

### 3. Log Habit Completion

```bash
curl -X POST http://localhost:3000/api/gamification/HABIT_ID/log \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Felt great today!",
    "completionTimeMinutes": 10
  }'
```

You should see the XP earned in the response!

### 4. Check User Profile (XP Updated)

```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Verify that `xp` has increased.

### 5. Get Habit Stats

```bash
curl http://localhost:3000/api/gamification/HABIT_ID/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

You should see:
- `currentStreak: 1`
- `totalCompletions: 1`
- `momentum` score

### 6. Get All Habits

```bash
curl http://localhost:3000/api/habits \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Get Habit Logs

```bash
curl http://localhost:3000/api/gamification/HABIT_ID/logs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Test Mode-Specific Features

### Discipline Mode (1.5x XP, No Edits)

```bash
# Register discipline user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "discipline@example.com",
    "username": "disciplineuser",
    "password": "password123",
    "mode": "DISCIPLINE"
  }'
```

Create a habit and log completion - you should earn 1.5x XP!

### Competitive Mode (1.2x XP, Time Bonuses)

```bash
# Register competitive user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "competitive@example.com",
    "username": "competitiveuser",
    "password": "password123",
    "mode": "COMPETITIVE"
  }'
```

Log completion with `completionTimeMinutes: 5` to get efficiency bonus!

## Test Streak System

1. Log a habit today
2. Wait until tomorrow (or modify `completedAt` in DB for testing)
3. Log the same habit again
4. Check stats - `currentStreak` should be 2

## Test Duplicate Prevention

Try logging the same habit twice in one day:

```bash
# First log - should succeed
curl -X POST http://localhost:3000/api/gamification/HABIT_ID/log \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Second log - should fail
curl -X POST http://localhost:3000/api/gamification/HABIT_ID/log \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

You should get an error: "Habit already logged today"

## Expected XP Calculation

For a difficulty 3 habit with 0 streak in BALANCED mode:
- Base XP: 10
- Difficulty multiplier: 1.5 (for difficulty 3)
- Streak bonus: 1.0 (no streak yet)
- Mode multiplier: 1.0 (BALANCED)
- **Total: 15 XP**

For the same habit with 10 streak:
- Base XP: 10
- Difficulty multiplier: 1.5
- Streak bonus: 1.1 (1 + 10/100)
- Mode multiplier: 1.0
- **Total: 16-17 XP**

## Health Checks

```bash
# API Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# Habit Service
curl http://localhost:3002/health
```

All should return `"status": "healthy"` and `"database": "connected"`.

## Troubleshooting

### "Habit already logged today" error
- This is expected behavior - you can only log each habit once per day
- For testing, you can manually delete the log from MongoDB or wait until the next day

### XP not updating
- Check that the Habit Service can reach the User Service
- Verify `USER_SERVICE_URL` environment variable is set correctly
- Check User Service logs for errors

### Streak not incrementing
- Streaks only increment when logging on consecutive days
- For testing, you may need to manually adjust `lastCompletedAt` in the database

---

**Happy Testing! 🎮**
