# BidFlow AI — Complete Project Documentation

**Project Name:** BidFlow AI  
**Version:** 1.0.0  
**Date:** May 2026  
**Technology Stack:** Spring Boot + React.js + MongoDB Atlas
---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Backend — Spring Boot](#5-backend--spring-boot)
6. [Frontend — React.js](#6-frontend--reactjs)
7. [Database — MongoDB](#7-database--mongodb)
8. [API Documentation](#8-api-documentation)
9. [Features](#9-features)
10. [User Roles & Permissions](#10-user-roles--permissions)
11. [Authentication & Security](#11-authentication--security)
12. [AI Features](#12-ai-features)
13. [Payment & Subscription](#13-payment--subscription)
14. [Live Map Tracking](#14-live-map-tracking)
15. [Multilanguage Support](#15-multilanguage-support)
16. [How to Run](#16-how-to-run)

---

## 1. Project Overview

BidFlow AI is a full-stack industrial bid management platform that enables organizations to manage the complete lifecycle of business bids — from client submission to final project completion. The platform integrates AI-powered features, real-time location tracking, multilanguage support, and a subscription-based payment system.

### Key Highlights
- Role-based access control (Client, Employee, Manager, Admin)
- AI-powered bid analysis using Google Gemini 2.0 Flash
- Real-time live map tracking using React Leaflet + OpenStreetMap
- JWT-based authentication with Google OAuth 2.0
- Subscription management with payment processing
- Multilanguage support (English, Hindi, Arabic)
- Dark/Light theme toggle
- Breadcrumb navigation with role badges

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT BROWSER                     │
│              React.js (Vite) — Port 5173             │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST (Axios)
                       │ JWT Bearer Token
┌──────────────────────▼──────────────────────────────┐
│              SPRING BOOT BACKEND                     │
│                   Port 8080                          │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Controllers │  │ Services │  │   Security     │  │
│  │ Auth/Bids   │  │ Gemini   │  │ JWT + Spring   │  │
│  │ AI/Location │  │ Notif.   │  │ Security       │  │
│  │ Payment     │  └──────────┘  └────────────────┘  │
│  └─────────────┘                                     │
└──────────────────────┬──────────────────────────────┘
                       │ MongoDB Driver
┌──────────────────────▼──────────────────────────────┐
│              MONGODB ATLAS (Cloud)                   │
│  Collections: users, bids, comments,                 │
│  notifications, payments, subscription_plans         │
└─────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│           EXTERNAL SERVICES                          │
│  • Google Gemini AI API                              │
│  • Google OAuth 2.0                                  │
│  • OpenStreetMap (Nominatim)                         │
└─────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | 17 | Programming language |
| Spring Boot | 3.2.5 | Backend framework |
| Spring Security | 6.2.4 | Authentication & authorization |
| Spring Data MongoDB | 4.2.5 | Database ORM |
| JWT (jjwt) | 0.12.5 | Token-based auth |
| OkHttp | 4.12.0 | HTTP client for Gemini API |
| Lombok | 1.18.32 | Boilerplate reduction |
| Jackson | 2.15.4 | JSON serialization |
| Maven | 3.x | Build tool |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.x | UI framework |
| Vite | 8.x | Build tool |
| React Router DOM | 7.x | Client-side routing |
| Zustand | 5.x | State management |
| Axios | 1.x | HTTP client |
| React Leaflet | 4.x | Map component |
| Leaflet | 1.9.4 | Map library |
| Recharts | 3.x | Charts & analytics |
| Framer Motion | 12.x | Animations |
| Lucide React | 1.x | Icons |
| React Hot Toast | 2.x | Notifications |
| Tailwind CSS | 4.x | Utility CSS |

### Database & Cloud
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Cloud database |
| Google Gemini 2.0 Flash | AI features |
| Google OAuth 2.0 | Social login |
| OpenStreetMap | Map tiles & geocoding |

---

## 4. Project Structure

```
Bid - Copy/
├── springboot-backend/              ← Spring Boot Backend
│   ├── pom.xml
│   ├── run.bat                      ← Quick start script
│   └── src/main/java/com/bidflow/
│       ├── BidflowApplication.java
│       ├── config/
│       │   ├── JacksonConfig.java
│       │   ├── MongoConfig.java
│       │   └── SecurityConfig.java
│       ├── controller/
│       │   ├── AdminController.java
│       │   ├── AiController.java
│       │   ├── AuthController.java
│       │   ├── BidController.java
│       │   ├── GoogleAuthController.java
│       │   ├── LocationController.java
│       │   ├── NotificationController.java
│       │   └── PaymentController.java
│       ├── dto/
│       │   ├── AuthResponse.java
│       │   ├── BidRequest.java
│       │   ├── LoginRequest.java
│       │   └── RegisterRequest.java
│       ├── model/
│       │   ├── Bid.java
│       │   ├── BidDocument.java
│       │   ├── BidHistory.java
│       │   ├── Comment.java
│       │   ├── Notification.java
│       │   ├── Payment.java
│       │   ├── SubscriptionPlan.java
│       │   ├── TrackingStage.java
│       │   └── User.java
│       ├── repository/
│       │   ├── BidRepository.java
│       │   ├── CommentRepository.java
│       │   ├── NotificationRepository.java
│       │   ├── PaymentRepository.java
│       │   ├── SubscriptionPlanRepository.java
│       │   └── UserRepository.java
│       ├── security/
│       │   ├── AuthHelper.java
│       │   ├── JwtAuthFilter.java
│       │   └── JwtUtil.java
│       └── service/
│           ├── GeminiService.java
│           └── NotificationService.java
│
└── frontend/                        ← React Frontend
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── i18n.js
        ├── api/
        │   ├── ai.js
        │   ├── auth.js
        │   ├── axios.js
        │   ├── bids.js
        │   ├── location.js
        │   ├── notifications.js
        │   └── payment.js
        ├── components/
        │   ├── ai/
        │   │   ├── AIChatWidget.jsx
        │   │   ├── SentimentBadge.jsx
        │   │   └── WinProbabilityCard.jsx
        │   ├── bids/
        │   │   ├── BidCard.jsx
        │   │   ├── BidFilters.jsx
        │   │   └── BidTimeline.jsx
        │   ├── layout/
        │   │   ├── BreadcrumbNav.jsx
        │   │   ├── DashboardLayout.jsx
        │   │   ├── Sidebar.jsx
        │   │   └── Topbar.jsx
        │   └── ui/
        │       ├── LanguageSwitcher.jsx
        │       ├── LoadingSpinner.jsx
        │       ├── Modal.jsx
        │       ├── StatCard.jsx
        │       └── StatusBadge.jsx
        ├── pages/
        │   ├── auth/
        │   ├── client/
        │   ├── employee/
        │   ├── manager/
        │   └── shared/
        └── store/
            ├── authStore.js
            ├── bidStore.js
            ├── languageStore.js
            ├── notificationStore.js
            └── themeStore.js
```

---

## 5. Backend — Spring Boot

### 5.1 Application Entry Point
`BidflowApplication.java` — Standard Spring Boot main class with `@SpringBootApplication`.

### 5.2 Configuration

**SecurityConfig.java**
- Disables CSRF (stateless REST API)
- Configures CORS for frontend origins (localhost:5173, 5174, 5175, 3000)
- Stateless session management (JWT)
- Public endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/google/**`, `/api/health`, `/api/admin/clear-all`
- All other endpoints require authentication

**MongoConfig.java** — Enables `@CreatedDate` and `@LastModifiedDate` auditing

**JacksonConfig.java** — Registers `JavaTimeModule` for `Instant` serialization

### 5.3 Security Layer

**JwtUtil.java**
- Generates JWT tokens with user ID as subject
- 7-day expiration
- HS256 signing with configurable secret

**JwtAuthFilter.java**
- Intercepts every request
- Supports real JWT tokens AND demo tokens (`demo-token-ROLE`)
- Attaches `User` object to Spring Security context

**AuthHelper.java**
- `getCurrentUser()` — extracts authenticated user from SecurityContext

### 5.4 Controllers

| Controller | Base Path | Description |
|-----------|-----------|-------------|
| AuthController | `/api/auth` | Register, login, profile, users |
| GoogleAuthController | `/api/auth/google` | OAuth 2.0 flow |
| BidController | `/api/bids` | Full bid CRUD + workflow |
| AiController | `/api/ai` | Gemini AI features |
| NotificationController | `/api/notifications` | Notification management |
| LocationController | `/api/location` | Live location tracking |
| PaymentController | `/api/payments` | Subscription & payments |
| AdminController | `/api/admin` | Admin utilities |

---

## 6. Frontend — React.js

### 6.1 Routing Structure

```
/                          → Landing page
/login                     → Login
/register                  → Register
/auth/google/success       → Google OAuth callback handler

/manager/*                 → Manager/Admin dashboard
  /manager                 → Dashboard
  /manager/bids            → All bids management
  /manager/bids/:id        → Bid detail
  /manager/analytics       → Analytics & charts
  /manager/ai              → AI Insights
  /manager/team            → Team overview
  /manager/employees       → Employee management
  /manager/clients         → Client management
  /manager/reports         → Reports
  /manager/settings        → Settings
  /manager/activity        → Activity feed
  /manager/map             → Live map tracking
  /manager/subscription    → Subscription & billing
  /manager/notifications   → Notifications
  /manager/profile         → Profile

/client/*                  → Client dashboard
  /client                  → Dashboard
  /client/bids             → My bids
  /client/map              → Live map
  /client/subscription     → Subscription
  /client/notifications    → Notifications
  /client/profile          → Profile

/employee/*                → Employee dashboard
  /employee                → Dashboard
  /employee/bids           → Assigned bids
  /employee/map            → Live map
  /employee/subscription   → Subscription
  /employee/notifications  → Notifications
  /employee/profile        → Profile
```

### 6.2 State Management (Zustand)

| Store | Persisted | Purpose |
|-------|-----------|---------|
| authStore | ✅ localStorage | User, token, isAuthenticated |
| themeStore | ✅ localStorage | dark/light theme |
| languageStore | ✅ localStorage | Selected language |
| bidStore | ❌ | Bids list, filters |
| notificationStore | ❌ | Notifications, unread count |

### 6.3 Theme System

CSS custom properties on `:root` for dark mode (default) and `:root[data-theme="light"]` for light mode. Theme toggled via `document.documentElement.dataset.theme`.

### 6.4 Key Components

**DashboardLayout** — Fixed sidebar + topbar + breadcrumb + main content area

**Sidebar** — Role-based navigation links, collapsible to icon-only mode, notification badge

**Topbar** — Search bar with live results, theme toggle, language switcher, notification bell, avatar

**BreadcrumbNav** — Shows current page path with clickable crumbs + role badge (color-coded)

**LanguageSwitcher** — Dropdown with EN/HI/AR flags

**AIChatWidget** — Floating chat button, opens AI assistant panel

---

## 7. Database — MongoDB

### 7.1 Collections

#### users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "password": "string (bcrypt hashed)",
  "role": "CLIENT | EMPLOYEE | MANAGER | ADMIN",
  "company": "string",
  "phone": "string",
  "isActive": "boolean",
  "lastLogin": "ISODate",
  "googleId": "string (sparse unique)",
  "authProvider": "local | google",
  "avatar": "string (URL)",
  "latitude": "double",
  "longitude": "double",
  "locationName": "string",
  "locationUpdatedAt": "ISODate",
  "locationSharing": "boolean",
  "subscriptionPlan": "FREE | BASIC | PRO | ENTERPRISE",
  "subscriptionStatus": "active | cancelled | expired | trial",
  "subscriptionStart": "ISODate",
  "subscriptionEnd": "ISODate",
  "billingCycle": "monthly | yearly",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

#### bids
```json
{
  "_id": "ObjectId",
  "bidNumber": "string (unique, e.g. BID-001-1234)",
  "title": "string",
  "description": "string",
  "clientName": "string",
  "clientId": "ObjectId ref users",
  "value": "double",
  "status": "new|under_review|proposal_generated|awaiting_approval|negotiation|approved|won|lost",
  "priority": "high | medium | low",
  "deadline": "ISODate",
  "assignedTo": "ObjectId ref users",
  "createdBy": "ObjectId ref users",
  "department": "string",
  "progress": "integer 0-100",
  "aiWinProbability": "integer 0-100",
  "clientSentiment": "positive | neutral | negative",
  "aiSummary": "string",
  "documents": "[{name, url, uploadedAt}]",
  "history": "[{action, user, userName, timestamp}]",
  "tags": "[string]",
  "requirements": "string",
  "budget": "double",
  "verificationStatus": "pending | verified | rejected",
  "verificationNote": "string",
  "verifiedBy": "ObjectId ref users",
  "verifiedAt": "ISODate",
  "completionNote": "string",
  "completionSubmittedAt": "ISODate",
  "managerApprovalNote": "string",
  "trackingStages": "[{stage, label, completedAt, completedBy, completedByName, note}]",
  "clientRating": "integer 1-5",
  "clientFeedback": "string",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

#### payments
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId ref users",
  "planId": "ObjectId ref subscription_plans",
  "planName": "string",
  "status": "pending | success | failed | refunded",
  "billingCycle": "monthly | yearly",
  "amount": "double",
  "currency": "USD",
  "paymentMethod": "card | upi | netbanking",
  "cardLast4": "string",
  "cardBrand": "string",
  "upiId": "string",
  "transactionId": "string",
  "invoiceNumber": "string",
  "periodStart": "ISODate",
  "periodEnd": "ISODate",
  "failureReason": "string",
  "createdAt": "ISODate"
}
```

#### subscription_plans
```json
{
  "_id": "ObjectId",
  "name": "FREE | BASIC | PRO | ENTERPRISE",
  "displayName": "string",
  "description": "string",
  "price": "double (monthly USD)",
  "yearlyPrice": "double",
  "maxBids": "integer (-1 = unlimited)",
  "maxEmployees": "integer (-1 = unlimited)",
  "aiFeatures": "boolean",
  "mapTracking": "boolean",
  "advancedAnalytics": "boolean",
  "prioritySupport": "boolean",
  "customReports": "boolean",
  "color": "string",
  "isActive": "boolean"
}
```

---

## 8. API Documentation

### 8.1 Authentication APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT token |
| GET | `/api/auth/profile` | JWT | Get current user profile |
| PUT | `/api/auth/profile` | JWT | Update profile |
| PUT | `/api/auth/change-password` | JWT | Change password |
| POST | `/api/auth/forgot-password` | Public | Forgot password (demo) |
| GET | `/api/auth/users` | Manager/Admin | Get all users |
| GET | `/api/auth/users/:id` | Manager/Admin | Get user by ID |
| GET | `/api/auth/google` | Public | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Public | Google OAuth callback |

### 8.2 Bid APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/bids` | JWT | Get all bids (role-filtered) |
| POST | `/api/bids` | JWT | Create new bid |
| GET | `/api/bids/analytics` | Manager | Analytics data |
| GET | `/api/bids/my-bids` | JWT | Get my bids |
| GET | `/api/bids/employees/list` | Manager | Get employee list |
| POST | `/api/bids/bulk/status` | Manager | Bulk status update |
| GET | `/api/bids/:id` | JWT | Get bid by ID |
| PUT | `/api/bids/:id` | JWT | Update bid |
| DELETE | `/api/bids/:id` | Manager | Delete bid |
| PATCH | `/api/bids/:id/status` | JWT | Update bid status |
| PATCH | `/api/bids/:id/assign` | Manager | Assign employee |
| PATCH | `/api/bids/:id/verify` | Manager | Verify bid requirements |
| PATCH | `/api/bids/:id/progress` | JWT | Update progress % |
| PATCH | `/api/bids/:id/submit-completion` | Employee | Submit work completion |
| PATCH | `/api/bids/:id/final-approval` | Manager | Final approval |
| POST | `/api/bids/:id/feedback` | JWT | Client feedback & rating |
| GET | `/api/bids/:id/tracking` | JWT | Get tracking info |
| GET | `/api/bids/:id/history` | JWT | Get bid history |
| POST | `/api/bids/:id/documents` | JWT | Upload document |
| GET | `/api/bids/:id/comments` | JWT | Get comments |
| POST | `/api/bids/:id/comments` | JWT | Add comment |

### 8.3 AI APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat` | JWT | AI chat assistant |
| POST | `/api/ai/sentiment` | JWT | Sentiment analysis |
| POST | `/api/ai/summary-text` | JWT | Summarize text |
| POST | `/api/ai/summary/:bidId` | JWT | Generate bid summary |
| GET | `/api/ai/predict/:bidId` | JWT | Win probability prediction |
| POST | `/api/ai/priority/:bidId` | JWT | Smart priority assignment |
| GET | `/api/ai/recommendations/:bidId` | JWT | Get recommendations |
| POST | `/api/ai/duplicates` | JWT | Duplicate detection |

### 8.4 Notification APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | JWT | Get my notifications |
| PATCH | `/api/notifications/read-all` | JWT | Mark all as read |
| PATCH | `/api/notifications/:id/read` | JWT | Mark one as read |
| DELETE | `/api/notifications/:id` | JWT | Delete notification |

### 8.5 Location APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/api/location/update` | JWT | Update my location |
| GET | `/api/location/me` | JWT | Get my location |
| PATCH | `/api/location/toggle-sharing` | JWT | Toggle location sharing |
| GET | `/api/location/all` | Manager | All user locations |
| GET | `/api/location/bid-context` | JWT | Role-based visible locations |

### 8.6 Payment APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/payments/plans` | JWT | Get subscription plans |
| GET | `/api/payments/my-subscription` | JWT | Get my subscription |
| GET | `/api/payments/history` | JWT | Payment history |
| POST | `/api/payments/subscribe` | JWT | Subscribe / upgrade / downgrade |
| POST | `/api/payments/cancel` | JWT | Cancel subscription |
| GET | `/api/payments/all` | Manager | All payments (admin) |

---

## 9. Features

### 9.1 Bid Management Workflow

```
CLIENT submits bid
        ↓
MANAGER reviews & verifies requirements
        ↓
MANAGER assigns to EMPLOYEE
        ↓
EMPLOYEE works on bid (updates progress %)
        ↓
EMPLOYEE submits completion with notes
        ↓
MANAGER gives final approval
        ↓
PROJECT COMPLETED (status: won)
        ↓
CLIENT gives rating & feedback (1-5 stars)
```

### 9.2 Bid Status Flow

```
new → under_review → proposal_generated → awaiting_approval → won
                                        ↘ negotiation (revision)
                   ↘ lost (rejected)
```

### 9.3 Notification System
- Auto-notifications on every bid action
- Real-time unread count in sidebar and topbar
- Notification types: info, success, warning, danger
- Auto-refresh every 60 seconds

### 9.4 Search
- Global search in topbar
- Debounced (350ms) live search across bid titles and client names
- Dropdown results with click-to-navigate

---

## 10. User Roles & Permissions

| Feature | CLIENT | EMPLOYEE | MANAGER | ADMIN |
|---------|--------|----------|---------|-------|
| Submit bid | ✅ | ❌ | ✅ | ✅ |
| View own bids | ✅ | ✅ | ✅ | ✅ |
| View all bids | ❌ | Own only | ✅ | ✅ |
| Verify bid | ❌ | ❌ | ✅ | ✅ |
| Assign employee | ❌ | ❌ | ✅ | ✅ |
| Update progress | ❌ | ✅ | ✅ | ✅ |
| Submit completion | ❌ | ✅ | ❌ | ❌ |
| Final approval | ❌ | ❌ | ✅ | ✅ |
| Give feedback | ✅ | ❌ | ❌ | ❌ |
| View analytics | ❌ | ❌ | ✅ | ✅ |
| Delete bid | ❌ | ❌ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ | ✅ |
| Live map (all) | ❌ | ❌ | ✅ | ✅ |
| Live map (own) | ✅ | ✅ | ✅ | ✅ |

---

## 11. Authentication & Security

### 11.1 JWT Authentication
- Token generated on login with user ID as subject
- 7-day expiration (604800000 ms)
- HS256 algorithm with 256-bit key
- Sent as `Authorization: Bearer <token>` header

### 11.2 Password Security
- BCrypt hashing with strength 12
- Minimum 6 characters required
- Password never returned in API responses

### 11.3 Google OAuth 2.0
- Redirect flow: `/api/auth/google` → Google → `/api/auth/google/callback`
- Creates new user or links to existing account
- Returns JWT token same as regular login

### 11.4 Demo Mode
- Tokens starting with `demo-token-` bypass JWT validation
- Attaches mock user with specified role
- Useful for testing without database

### 11.5 CORS Configuration
Allowed origins: `localhost:5173`, `5174`, `5175`, `3000`

---
