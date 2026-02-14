# HabitForge - Quick Start Guide

## 🚀 Getting Started

This guide will help you get the HabitForge microservices up and running on your local machine.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/habitforge.git
cd habitforge
```

### 2. Install Dependencies

Install dependencies for each service:

```bash
# Shared library
cd shared
npm install
npm run build
cd ..

# API Gateway
cd api-gateway
npm install
cd ..

# User Service
cd user-service
npm install
cd ..

# Note: Habit, Club, and Analytics services will be set up in future sessions
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

**Important**: Update the `.env` file with your own values, especially:
- `JWT_SECRET` - Use a strong, random secret key
- Database passwords if deploying to production

### 4. Start Services with Docker Compose

Start MongoDB and Redis:

```bash
docker-compose up -d mongodb redis
```

Wait for services to be healthy (check with `docker-compose ps`).

### 5. Run Services in Development Mode

Open separate terminal windows for each service:

**Terminal 1 - API Gateway:**
```bash
cd api-gateway
npm run dev
```

**Terminal 2 - User Service:**
```bash
cd user-service
npm run dev
```

## 🧪 Testing the API

### Health Check

```bash
# API Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health
```

### Register a New User

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

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from the response.

### Get User Profile

```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Profile

```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "mode": "DISCIPLINE"
  }'
```

## 📊 Service Ports

| Service | Port | Status |
|---------|------|--------|
| API Gateway | 3000 | ✅ Running |
| User Service | 3001 | ✅ Running |
| Habit Service | 3002 | 🔴 Not Started |
| Club Service | 3003 | 🔴 Not Started |
| Analytics Service | 3004 | 🔴 Not Started |
| MongoDB | 27017 | ✅ Running |
| Redis | 6379 | ✅ Running |

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose ps redis

# View Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### Port Already in Use

If you get "port already in use" errors:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

## 🔧 Development Commands

### Build TypeScript

```bash
# In any service directory
npm run build
```

### Run in Development Mode (with hot reload)

```bash
npm run dev
```

### Run in Production Mode

```bash
npm run build
npm start
```

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Behavioral Modes

- **DISCIPLINE**: Strict tracking, no edits, 1.5x XP multiplier
- **BALANCED**: Flexible tracking, 2-hour edit window, 1.0x XP multiplier
- **COMPETITIVE**: Real-time competition, time bonuses, 1.2x XP multiplier

### Rate Limits (per hour)

- **DISCIPLINE**: 100 requests
- **BALANCED**: 150 requests
- **COMPETITIVE**: 300 requests
- **Unauthenticated**: 50 requests

## 🎯 Next Steps

1. **Test the authentication flow** - Register, login, get profile
2. **Build Habit Service** - Next development session
3. **Implement XP calculation** - Gamification engine
4. **Create habit logging** - Core functionality

## 📚 Additional Resources

- [README.md](README.md) - Full project documentation
- [agents.md](agents.md) - Project state tracker
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🆘 Need Help?

- Check the [agents.md](agents.md) file for project status
- Review service logs: `docker-compose logs <service-name>`
- Ensure all dependencies are installed: `npm install`

---

**Happy Coding! 🚀**
