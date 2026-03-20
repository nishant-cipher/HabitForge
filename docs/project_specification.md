# HabitForge: Project Specification

## 1. Problem Statement

In today's fast-paced digital environment, especially among Gen Z, traditional habit-tracking applications often fail to maintain long-term user engagement. They tend to be either too rigid, causing users to abandon them after a single failure, or too lenient, failing to instill real discipline. Furthermore, habit formation is often treated as an isolated, single-player experience, neglecting the powerful psychological drivers of social accountability and gamified reward systems.

HabitForge addresses this gap by providing an adaptive habit-tracking platform that dynamically adjusts to varying user behaviors. By offering distinct behavioral modes (Discipline, Balanced, and Competitive) combined with a robust gamification engine and social club ecosystem, HabitForge transforms the solitary struggle of habit formation into an engaging, adaptable, and socially reinforced journey.

## 2. Objectives and Roadmap

### Objective 1: Implement Adaptive Gamification Engine

*Goal: Provide personalized progression and reward systems based on different user tracking styles.*
**Roadmap:**

- **Phase 1:** Develop core XP calculation algorithms factoring habit difficulty (1-5), streak length, and efficiency.
- **Phase 2:** Implement the three distinct behavioral modes (Discipline, Balanced, Competitive) with specific XP multipliers and penalty rules.
- **Phase 3:** Build the badge awarding system and streak momentum scoring mechanisms.
- **Phase 4:** Create background worker jobs for daily resets, streak decays, and daily calculations.

### Objective 2: Social and Accountability Ecosystem

*Goal: Leverage community support and friendly competition to drive habit adherence.*
**Roadmap:**

- **Phase 1:** Develop the Club System allowing public, private, and invite-only groups.
- **Phase 2:** Implement real-time leaderboards (global, club-specific, and time-based metrics).
- **Phase 3:** Introduce progress sharing with controlled visibility features.
- **Phase 4:** Build activity feeds to broadcast member updates and achievements within clubs.

### Objective 3: Analytics and Data Visualization

*Goal: Provide users with actionable insights into their habit-forming progress.*
**Roadmap:**

- **Phase 1:** Aggregate data for habit completion trends and generation of consistency scores.
- **Phase 2:** Implement visual heatmaps and progress data visualizations on user dashboards.

### Objective 4: Integrated Productivity Management

*Goal: Bridge the gap between daily habits and ad-hoc responsibilities.*
**Roadmap:**

- **Phase 1:** Develop core To-Do list and task management features (CRUD).
- **Phase 2:** Implement deadline sorting, priority flagging, and integrated reminders.
- **Phase 3:** Sync task completion statistics with the overall user gamification profile.

### Objective 5: Scalable Microservices Infrastructure

*Goal: Ensure high availability, performance, and maintainability across the platform.*
**Roadmap:**

- **Phase 1:** Containerize all decoupled services (User, Habit, Club, Analytics, Task) using Docker.
- **Phase 2:** Implement the API Gateway with JWT validation, Traefik reverse proxy, and Redis-backed rate limiting.
- **Phase 3:** Establish centralized metrics scraping using Prometheus and Grafana for real-time observability.
- **Phase 4:** Prepare CI/CD pipelines and deployment configurations for cloud environments.

## 3. Software Requirements

### System & Infrastructure Architecture

- **Microservices Architecture:** 6 decoupled microservices:
  - API Gateway (Port 3000)
  - User Service (Port 3001)
  - Habit & Gamification Service (Port 3002)
  - Club & Leaderboard Service (Port 3003)
  - Analytics & Worker Service (Port 3004)
  - Task Service (Port 3005)
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy / Load Balancer:** Traefik v2.11 (with automated Let's Encrypt TLS/SSL configuration)
- **Hardware/OS Environment:** Linux-based container deployment

### Backend Technologies

- **Runtime:** Node.js (Version 18+)
- **Architecture:**RESTful HTTP services
- **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)
- **Metrics Integration:** `express-prom-bundle`

### Frontend Technologies

- **Framework:** React Web Application
- **Build Tool:** Vite

### Databases & Caching

- **Primary Database:** MongoDB (Version 6.0+)
  - *Collections:* `users`, `sessions`, `habits`, `habitLogs`, `userStats`, `badges`, `clubs`, `memberships`, `leaderboards`, `analyticsCache`, `aggregates`, `tasks`
- **Cache & Message Broker:** Redis (Version 7.0+ Alpine)
  - *Usage:* User data caching, Leaderboard TTL, Rate limiting, Async job queues

### Monitoring & Observability

- **Metrics Database:** Prometheus (Time-series data, 15-day retention configuration)
- **Visualization:** Grafana
- **Host Metrics:** Node Exporter
- **Container Metrics:** Google cAdvisor
