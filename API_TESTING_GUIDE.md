# HabitForge Complete API Testing Guide

## Quick Start

All services are accessible through the API Gateway at `http://localhost:3000`.

### Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `HabitForge.postman_collection.json`
4. The collection automatically manages tokens and IDs

## Complete Test Flow

### 1. Authentication
**Register User** → Access token saved automatically
```json
{
  "email": "testuser@example.com",
  "username": "testuser",
  "password": "password123",
  "mode": "BALANCED"
}
```

**OR Login** (with email or username)

### 2. User Profile
**Get Profile** → See initial XP (0), level (1)

### 3. Habits
**Create Habit** → Habit ID saved automatically
**Get All Habits** → View your habits

### 4. Gamification
**Log Completion** → Earn XP (~15 for difficulty 3)
**Get Stats** → See streak and momentum
**Get Logs** → View completion history

### 5. Analytics
**Get Dashboard** → See aggregated stats
**Get Trends** → View habit trends (DAILY/WEEKLY/MONTHLY)

### 6. Clubs (NEW!)
**Create Club** → Club ID saved automatically
**Add Club Task** → Create habit for club members
**Accept Task** → Task syncs to your personal habits
**Get Activity** → See member actions
**Send Chat** → Communicate with club members

## API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (email OR username)

### User Profile (Protected)
- `GET /api/users/profile` - Get user profile

### Habits (Protected)
- `POST /api/habits` - Create habit
- `GET /api/habits` - Get all habits

### Gamification (Protected)
- `POST /api/gamification/:habitId/log` - Log completion
- `GET /api/gamification/:habitId/stats` - Get stats
- `GET /api/gamification/:habitId/logs` - Get logs

### Clubs (Protected) - NEW
- `POST /api/clubs` - Create club
- `GET /api/clubs` - Get my clubs
- `GET /api/clubs/:id` - Get club details
- `POST /api/clubs/:id/join` - Join club
- `POST /api/clubs/:id/leave` - Leave club
- `GET /api/clubs/:id/members` - Get members
- `POST /api/clubs/:id/habits` - Add task (owner/admin only)
- `GET /api/clubs/:id/habits` - Get tasks
- `POST /api/clubs/:id/habits/:habitId/accept` - Accept task
- `GET /api/clubs/:id/accepted-habits` - Get my accepted tasks
- `GET /api/clubs/:id/activity` - Get activity feed
- `GET /api/clubs/:id/chat` - Get chat messages
- `POST /api/clubs/:id/chat` - Send message

### Analytics (Protected) - NEW
- `GET /api/analytics/dashboard` - Get dashboard
- `GET /api/analytics/trends?period=WEEKLY` - Get trends

## Test Scenarios

### Scenario 1: Individual Habit Tracking
1. Register → Login → Create Habit → Log Completion → Check Profile (XP increased)

### Scenario 2: Club Workflow
1. Register → Create Club → Add Task → Accept Task → Check Habits (task appears)
2. Log Completion → Check Activity (log appears in club feed)

### Scenario 3: Analytics Dashboard
1. Create multiple habits → Log completions → Get Dashboard (see aggregated stats)
2. Get Trends → View completion patterns

## Troubleshooting

### "Invalid token"
- Make sure you've run Register or Login first
- Token is automatically saved to collection variables

### "Route not found"
- Verify all services are running: `sudo docker ps | grep habitforge`
- Check API Gateway logs: `sudo docker logs habitforge-api-gateway`

### Service not responding
- Restart service: `sudo docker restart habitforge-[service-name]`
- Check logs for errors

## Service URLs (Direct Access)

For debugging, you can access services directly:
- User Service: `http://localhost:3001`
- Habit Service: `http://localhost:3002`
- Club Service: `http://localhost:3003`
- Analytics Service: `http://localhost:3004`

**Recommended:** Always use API Gateway (`http://localhost:3000`) for testing.

## Collection Variables

The collection automatically manages:
- `accessToken` - JWT token (saved after login/register)
- `habitId` - Last created habit ID
- `clubId` - Last created club ID
- `clubHabitId` - Last created club task ID

## Next Steps

1. Test complete individual flow
2. Test club creation and task acceptance
3. Verify task sync to personal habits
4. Test analytics dashboard accuracy
5. Test chat and activity feed

---

**All 30+ endpoints ready for testing! 🚀**
