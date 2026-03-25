# HabitForge
Adaptive habit-tracking platform with gamification &amp; social accountability
# HabitForge: Adaptive Habit-Tracking Platform 

> **A complete habit-tracking system designed for Gen Z with personalized gamification and social accountability**

##  Project Overview

HabitForge is an adaptive habit-tracking platform featuring three distinct behavioral modes with personalized gamification and social accountability systems tailored for Gen Z users.

###  Three Behavioral Modes
- **Discipline Mode**: Strict tracking with high XP multipliers and penalties
- **Balanced Mode**: Flexible tracking with moderate rewards
- **Competitive Mode**: Time-based bonuses and social competition features

##  System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Client Applications                         │
│                  (React/Vite Web Application)                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTPS/REST
┌──────────────────────▼───────────────────────────────────────────┐
│                     API Gateway (3000)                           │
│   • JWT Validation • Rate Limiting • Request Routing             │
└─────┬──────────────┬──────────────┬──────────────┬─────────┬─────┘
      │              │              │              │         │
┌─────▼─────┐  ┌────▼──────┐  ┌───▼──────┐  ┌───▼─────┐ ┌───▼─────┐
│ User      │  │ Habit &   │  │ Club &   │  │ Analytics││ Task    │
│ Service   │  │ Game      │  │ Leader-  │  │ & Worker ││ Service │
│ (3001)    │  │ Service   │  │ board    │  │ Service  ││ (3005)  │
│           │  │ (3002)    │  │ (3003)   │  │ (3004)   ││         │
└─────┬─────┘  └────┬──────┘  └───┬──────┘  └───┬─────┘ └───┬─────┘
      │              │              │              │         │
┌─────▼──────────────▼──────────────▼──────────────▼─────────▼─────┐
│               MongoDB + Redis (Cache & Queue)                    │
└──────────────────────────────────────────────────────────────────┘
```

##  Services Breakdown

### 1. **API Gateway Service** (`:3000`)
- Single entry point for all client requests
- JWT token validation and request routing
- Rate limiting using Redis

### 2. **User Service** (`:3001`) 👤
- Authentication & authorization (JWT-based)
- User profile management and mode selection
- XP & level progression tracking
- **Database**: MongoDB (`users`, `sessions` collections)

### 3. **Habit & Gamification Service** (`:3002`) ⚙️🎮
- Habit CRUD operations with categorization
- Daily logging system with mode-specific rules
- Gamification engine with XP calculation
- **Database**: MongoDB (`habits`, `habitLogs`, `userStats`, `badges`)

### 4. **Club & Leaderboard Service** (`:3003`) 👥
- Club management with role-based permissions
- Real-time leaderboard calculations
- Social features and progress sharing
- **Database**: MongoDB (`clubs`, `memberships`, `leaderboards`)

### 5. **Analytics & Worker Service** (`:3004`) 📊⏳
- Dashboard data aggregation and analytics
- Background job processing (daily resets, streak decay)
- **Database**: MongoDB (`analyticsCache`, `aggregates`)

### 6. **Task Service** (`:3005`) ✅
- To-do list management integrated with the ecosystem
- Task completion statistics tracking
- Due date / reminder features
- **Database**: MongoDB (`tasks`)

##  Data Storage

### Primary Database: MongoDB
- **User Service**: `users`, `sessions`
- **Habit Service**: `habits`, `habitLogs`, `userStats`, `badges`
- **Club Service**: `clubs`, `memberships`, `leaderboards`
- **Analytics Service**: `analyticsCache`, `aggregates`
- **Task Service**: `tasks`

### Caching & Queue: Redis
- User data caching (profiles, XP, mode)
- Leaderboard caching with TTL strategies
- Rate limiting implementation
- Async job queues for background processing

### Metrics Storage: Prometheus
- Time-series database for scraping service metrics
- Stores response latencies, HTTP request counts, and memory/CPU usage for all services

##  Core Features

###  Gamification System
- **XP Calculation** based on:
  - Habit difficulty (1-5)
  - Current streak length
  - User mode multipliers
  - Completion efficiency
- **Badge awarding system**
- **Streak tracking** with decay algorithms
- **Momentum scoring**

###  Social & Competitive Features
- **Club System**: Public/Private/Invite-only clubs
- **Leaderboards**: Global, club-specific, and time-based rankings
- **Progress Sharing**: Controlled visibility within clubs
- **Activity Feeds**: Club member updates and achievements

###  Analytics & Insights
- **Habit completion trends** and heatmaps
- **Consistency scoring algorithms**
- **Progress visualization** data
- **Weekly summary generation**

###  Productivity Integration
- **Task and To-do Management**: Create, track, and complete tasks.
- **Deadline Sorting & Priorities**: Organize by urgency.

##  System Flows

### Flow 1: User Habit Logging
```
Client → API Gateway → Habit Service → 
1. Validate mode rules → 
2. Create immutable log → 
3. Calculate XP → 
4. Update cache → 
5. Queue async updates
```

### Flow 2: Daily Background Processing
```
Worker Service (00:00 UTC) → 
1. Reset daily habits → 
2. Calculate streak decay → 
3. Recalculate leaderboards → 
4. Generate weekly summaries → 
5. Warm caches
```

### Flow 3: User Mode Switching
```
User requests mode change → 
1. Validate eligibility → 
2. Update user profile → 
3. Invalidate related caches → 
4. Recalculate multipliers → 
5. Notify relevant services
```

##  Security & Performance

###  Security Features
- JWT-based authentication
- Role-based access control for club management
- CORS management and security headers

###  Performance Optimizations
- **Caching** for leaderboards and gamification using Redis
- Logical separation of data via multiple collections/databases

##  Deployment

### Environment Configuration
The entire application stack relies on a centralized `.env` configuration for secrets, database URIs, and inter-service URLs. 

### Development Environment
```yaml
# Docker Compose Setup (docker-compose.yml)
services:
  api-gateway:3000
  user-service:3001
  habit-service:3002
  club-service:3003
  analytics-service:3004
  task-service:3005
  redis:6379
  prometheus:9090
  grafana:3006
```
For local development using Docker Desktop, you can utilize the `start-services-desktop.sh` script to streamline startup. For production deployment on a cloud compute instance, please refer to our `DEPLOYMENT_GUIDE.md`.

##  Monitoring & Metrics

### Health Checks
- `/health`: Service status, database connectivity, uptime
- `/metrics`: Prometheus metrics endpoint exposed by all services (powered by `express-prom-bundle`)

### Centralized Monitoring Stack
- **Prometheus**: Automatically scrapes `/metrics` from all running containers internally.
- **Grafana**: Pre-provisioned dashboards visualizing container health, API response latencies, and route usage.

### Key Metrics Tracked
- **Technical**: Response latency (p95, p99), error rates, memory footprint, cache hit ratios
- **Business**: Daily active users, habit completion rates, club engagement
- **Performance**: Database query times, Redis latency, API throughput


## 📁 Project Structure
```
habitforge/
├── client/               # React Web Application (Frontend)
├── api-gateway/          # API Gateway Service
├── user-service/         # User Management Service
├── habit-service/        # Habit & Gamification Service
├── club-service/         # Club & Leaderboard Service
├── analytics-service/    # Analytics & Worker Service
├── task-service/         # Task Management Service
├── shared/               # Shared libraries & types
├── prometheus/           # Prometheus scraping configuration
├── grafana/              # Grafana dashboards & provisioning
├── docker-compose.yml    # Development environment
├── .env.example          # Environment variables template
├── start-services-desktop.sh # Easy local Docker startup script
│── DEPLOYMENT_GUIDE.md   # Production deployment instructions
└── docs/                 # General documentation & testing guides
```

##  Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB 6.0+
- Redis 7.0+

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/habitforge.git
cd habitforge

# Configure Environment Variables
cp .env.example .env
# Edit .env with your specific MongoDB URI and JWT Keys if needed

# Start all services
docker-compose --env-file .env up -d --build
# Alternatively, for Docker Desktop:
# ./start-services-desktop.sh

# Access the API Gateway
curl http://localhost:3000/api/health

# Access Grafana Monitoring Dashboard
# Browse to: http://localhost:3006
```

## 📄 License
MIT License - see [LICENSE](LICENSE) file for details.
---

**HabitForge** - Forge better habits, one day at a time. 🛠️✨
