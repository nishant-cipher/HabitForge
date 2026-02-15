# Quick API Gateway Test Commands

## 1. Health Check
```bash
curl http://localhost:3000/health | jq .
```

## 2. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quicktest@example.com",
    "username": "quicktest",
    "password": "password123",
    "mode": "BALANCED"
  }' | jq .
```

**Save the `accessToken` from the response!**

## 3. Login (with email)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quicktest@example.com",
    "password": "password123"
  }' | jq .
```

## 4. Get Profile (replace YOUR_TOKEN)
```bash
TOKEN="YOUR_TOKEN_HERE"

curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## 5. Create Habit
```bash
curl -X POST http://localhost:3000/api/habits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Exercise",
    "description": "30 minutes cardio",
    "category": "HEALTH",
    "difficulty": 3,
    "frequency": "DAILY"
  }' | jq .
```

**Save the habit `_id` from the response!**

## 6. Log Habit Completion
```bash
HABIT_ID="YOUR_HABIT_ID_HERE"

curl -X POST http://localhost:3000/api/gamification/$HABIT_ID/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Felt great!",
    "completionTimeMinutes": 30
  }' | jq .
```

## 7. Create Club
```bash
curl -X POST http://localhost:3000/api/clubs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fitness Warriors",
    "description": "A club for fitness enthusiasts"
  }' | jq .
```

**Save the club `_id` from the response!**

## 8. Add Club Task
```bash
CLUB_ID="YOUR_CLUB_ID_HERE"

curl -X POST http://localhost:3000/api/clubs/$CLUB_ID/habits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Push-ups",
    "description": "50 push-ups every day",
    "category": "HEALTH",
    "difficulty": 3,
    "frequency": "DAILY"
  }' | jq .
```

## 9. Get Analytics Dashboard
```bash
curl http://localhost:3000/api/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## 10. Get Trends
```bash
curl "http://localhost:3000/api/analytics/trends?period=WEEKLY" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Complete Automated Test

Run the comprehensive test script:
```bash
./test-api-gateway.sh
```

This will test all 30+ endpoints automatically and show you which ones pass/fail.

---

## Troubleshooting

### Check if services are running
```bash
sudo docker ps | grep habitforge
```

### Check API Gateway logs
```bash
sudo docker logs -f habitforge-api-gateway
```

### Check specific service logs
```bash
sudo docker logs -f habitforge-club-service
sudo docker logs -f habitforge-analytics-service
```

### Restart API Gateway
```bash
sudo docker restart habitforge-api-gateway
```
