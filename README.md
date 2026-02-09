# HabitForge
Adaptive habit-tracking platform with gamification &amp; social accountability
# HabitForge: Adaptive Habit-Tracking Platform 🚀

> **A complete habit-tracking system designed for Gen Z with personalized gamification and social accountability**

## 📋 Project Overview

HabitForge is an adaptive habit-tracking platform featuring three distinct behavioral modes with personalized gamification and social accountability systems tailored for Gen Z users.

### 🎯 Three Behavioral Modes
- **Discipline Mode**: Strict tracking with high XP multipliers and penalties
- **Balanced Mode**: Flexible tracking with moderate rewards
- **Competitive Mode**: Time-based bonuses and social competition features

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│              (Web, Mobile, Future Integrations)             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/REST/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                    API Gateway (3000)                       │
│  • JWT Validation • Rate Limiting • Request Routing         │
└─────┬──────────────┬──────────────┬──────────────┬──────────┘
      │              │              │              │
┌─────▼─────┐  ┌────▼──────┐  ┌───▼──────┐  ┌───▼─────────┐
│ User      │  │ Habit &   │  │ Club &   │  │ Analytics & │
│ Service   │  │ Game      │  │ Leader-  │  │ Worker      │
│ (3001)    │  │ Service   │  │ board    │  │ Service     │
│           │  │ (3002)    │  │ Service  │  │ (3004)      │
│           │  │           │  │ (3003)   │  │             │
└─────┬─────┘  └────┬──────┘  └───┬──────┘  └───┬─────────┘
      │              │              │              │
┌─────▼──────────────▼──────────────▼──────────────▼─────────┐
│              MongoDB + Redis (Cache & Queue)               │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Services Breakdown

### 1. **API Gateway Service** (`:3000`)
- Single entry point for all client requests
- JWT token validation and rate limiting
- Circuit breaker pattern for service failures
- Mode-based rate limiting (Competitive mode allows more frequent updates)

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
- Async job processing with Redis Queue (BullMQ)
- **Database**: MongoDB (`analyticsCache`, `aggregates`)

## 🗃️ Data Storage

### Primary Database: MongoDB
- **User Service**: `users`, `sessions`
- **Habit Service**: `habits`, `habitLogs`, `userStats`, `badges`
- **Club Service**: `clubs`, `memberships`, `leaderboards`
- **Analytics Service**: `analyticsCache`, `aggregates`

### Caching & Queue: Redis
- User data caching (profiles, XP, mode)
- Leaderboard caching with TTL strategies
- Rate limiting implementation
- Async job queues for background processing

## ⚡ Core Features

### 🎮 Gamification System
- **XP Calculation** based on:
  - Habit difficulty (1-5)
  - Current streak length
  - User mode multipliers
  - Completion efficiency
- **Badge awarding system**
- **Streak tracking** with decay algorithms
- **Momentum scoring**

### 👥 Social & Competitive Features
- **Club System**: Public/Private/Invite-only clubs
- **Leaderboards**: Global, club-specific, and time-based rankings
- **Progress Sharing**: Controlled visibility within clubs
- **Activity Feeds**: Club member updates and achievements

### 📊 Analytics & Insights
- **Habit completion trends** and heatmaps
- **Consistency scoring algorithms**
- **Progress visualization** data
- **Weekly summary generation**

## 🔄 System Flows

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

## 🛡️ Security & Performance

### 🔒 Security Features
- JWT-based authentication with Redis token storage
- Role-based access control for club management
- Mode-based rate limiting using token bucket algorithm
- CORS management and security headers

### ⚡ Performance Optimizations
- **Aggressive caching** with smart invalidation rules
- **Redis clustering** for high availability
- **Database sharding** strategy (by userId, clubId)
- **Eventual consistency model** for gamification updates

## 🚀 Deployment

### Development Environment
```yaml
# Docker Compose Setup
services:
  api-gateway:3000
  user-service:3001
  habit-service:3002
  club-service:3003
  analytics-service:3004
  mongodb:27017
  redis:6379
```

### Production Architecture
- **Kubernetes** deployment with separate pods per service
- **Horizontal scaling** for stateless services
- **MongoDB replica sets** with sharding for growth
- **Nginx ingress controller** for load balancing
- **Autoscaling** based on CPU, memory, and custom metrics

## 📈 Monitoring & Metrics

### Health Checks
- `/health`: Service status, database connectivity, uptime
- `/metrics`: Prometheus metrics endpoint

### Key Metrics Tracked
- **Technical**: Response latency, error rates, cache hit ratios
- **Business**: Daily active users, habit completion rates, club engagement
- **Performance**: Database query times, Redis latency, API throughput

## 🎯 Design Decisions & Trade-offs

| Decision | Trade-off | Benefit |
|----------|-----------|---------|
| **4 services instead of 8+** | Reduced complexity vs perfect separation | Easier deployment and debugging |
| **Redis Queue instead of Kafka** | Less features vs simpler operations | Easier setup, adequate for scale |
| **Eventual consistency for gamification** | Immediate consistency vs performance | Better UX, acceptable XP delay |
| **MongoDB for all services** | Not perfect fit for all vs simplicity | Single technology stack |

## 📊 Success Metrics

### Technical Goals
- API response time < 200ms (p95)
- Cache hit ratio > 90%
- Service availability > 99.9%
- Background job completion < 5 minutes

### Business Goals
- High user retention across all modes
- Consistent habit completion rates
- Strong club engagement metrics
- Positive mode switching patterns

## 🔮 Future Enhancements

### Short-term (Post-MVP)
- Mobile app with offline sync capability
- Advanced analytics dashboard
- Custom habit templates
- Exportable progress reports

### Long-term Vision
- AI-based habit recommendations
- Integration with health/fitness apps
- Organization-wide club features
- Advanced rule engine for custom modes

## 📁 Project Structure
```
habitforge/
├── api-gateway/          # API Gateway Service
├── user-service/         # User Management Service
├── habit-service/        # Habit & Gamification Service
├── club-service/         # Club & Leaderboard Service
├── analytics-service/    # Analytics & Worker Service
├── shared/              # Shared libraries & types
├── docker-compose.yml   # Development environment
└── kubernetes/          # Production deployment files
```

## 🚀 Getting Started

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

# Start all services
docker-compose up -d

# Access the API
curl http://localhost:3000/health
```

## 📄 License
MIT License - see [LICENSE](LICENSE) file for details.

## 👥 Contributing
Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📞 Support
- [Documentation](docs/)
- [Issue Tracker](https://github.com/yourusername/habitforge/issues)
- [Discussion Forum](https://github.com/yourusername/habitforge/discussions)

---

**HabitForge** - Forge better habits, one day at a time. 🛠️✨
