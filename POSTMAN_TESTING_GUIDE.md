# HabitForge API Gateway Testing Guide

## Quick Start

All services are now accessible through the API Gateway at `http://localhost:3000`.

### Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `HabitForge.postman_collection.json`
4. The collection will automatically manage tokens and IDs

## Complete Test Flow

Follow these requests in order:

### 1. Register a New User

**Request:** `Authentication > Register User`

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": "...",
      "email": "testuser@example.com",
      "username": "testuser",
      "mode": "BALANCED",
      "xp": 0,
      "level": 1
    }
  }
}
```

✅ **Access token automatically saved to collection variables**

---

### 2. Login (Alternative)

**Request:** `Authentication > Login User`

Use this if you already registered. Same response as registration.

---

### 3. Get User Profile

**Request:** `User Profile > Get Profile`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "testuser@example.com",
    "username": "testuser",
    "mode": "BALANCED",
    "xp": 0,
    "level": 1,
    "createdAt": "..."
  }
}
```

Note the initial XP is 0.

---

### 4. Create a Habit

**Request:** `Habits > Create Habit`

**Expected Response:**
```json
{
  "success": true,
  "message": "Habit created successfully",
  "data": {
    "_id": "...",
    "name": "Morning Exercise",
    "description": "30 minutes of cardio",
    "category": "HEALTH",
    "difficulty": 3,
    "frequency": "DAILY",
    "userId": "...",
    "isActive": true
  }
}
```

✅ **Habit ID automatically saved to collection variables**

---

### 5. Get All Habits

**Request:** `Habits > Get All Habits`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Morning Exercise",
      "category": "HEALTH",
      "difficulty": 3,
      "frequency": "DAILY"
    }
  ]
}
```

---

### 6. Log Habit Completion

**Request:** `Gamification > Log Habit Completion`

**Expected Response:**
```json
{
  "success": true,
  "message": "Habit completion logged successfully",
  "data": {
    "log": {
      "_id": "...",
      "habitId": "...",
      "userId": "...",
      "completedAt": "...",
      "notes": "Felt great today!",
      "completionTimeMinutes": 30
    },
    "xpEarned": 15,
    "currentStreak": 1
  }
}
```

Note the `xpEarned` value (approximately 15 XP for difficulty 3).

---

### 7. Verify XP Update

**Request:** `User Profile > Get Profile`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "xp": 15,  // ← XP increased!
    "level": 1,
    ...
  }
}
```

The XP should now be increased from 0 to ~15.

---

### 8. Check Habit Stats

**Request:** `Gamification > Get Habit Stats`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "habitId": "...",
    "currentStreak": 1,
    "longestStreak": 1,
    "totalCompletions": 1,
    "completionRate": 100,
    "momentum": {
      "score": 100,
      "trend": "building"
    }
  }
}
```

---

### 9. View Habit Logs

**Request:** `Gamification > Get Habit Logs`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "habitId": "...",
      "completedAt": "...",
      "notes": "Felt great today!",
      "completionTimeMinutes": 30
    }
  ]
}
```

---

## Testing Multiple Completions

To test streak tracking and XP accumulation:

1. Run "Log Habit Completion" multiple times
2. Each completion should:
   - Increment `currentStreak`
   - Add more XP
   - Update momentum score

---

## Service Endpoints

### Via API Gateway (Recommended)
- **Base URL:** `http://localhost:3000`
- **Auth:** `/api/auth/register`, `/api/auth/login`
- **Users:** `/api/users/profile`
- **Habits:** `/api/habits`
- **Gamification:** `/api/gamification/:habitId/log`, `/api/gamification/:habitId/stats`

### Direct Service Access (For Debugging)
- User Service: `http://localhost:3001`
- Habit Service: `http://localhost:3002`
- Club Service: `http://localhost:3003` (placeholder)
- Analytics Service: `http://localhost:3004` (placeholder)

---

## Troubleshooting

### "Invalid credentials" Error
- Make sure you're using the correct email/password
- Try registering a new user first

### "No token provided" Error
- Check that the access token is saved in collection variables
- Re-run the Login request to get a fresh token

### "Route not found" Error
- Verify the API Gateway is running: `curl http://localhost:3000/health`
- Check that all services are running: `sudo docker ps`

### Token Expired
- JWT tokens expire after 15 minutes
- Simply run the Login request again to get a new token

---

## Success Criteria

✅ All requests return 200/201 status codes  
✅ Access token is automatically saved after login/register  
✅ Habit ID is automatically saved after creating a habit  
✅ XP increases after logging habit completion  
✅ Streak counter increments with each completion  
✅ User profile shows updated XP and level  

---

**All services are ready for testing! 🎉**
