# BidFlow Spring Boot Backend

Complete Spring Boot migration of the Node.js/Express backend.  
All APIs, features, and behavior are **identical** to the original Node.js backend.

## Tech Stack
- **Java 17** + **Spring Boot 3.2.5**
- **Spring Data MongoDB** (same MongoDB Atlas database)
- **Spring Security** + **JWT** (same token format, same secret)
- **Gemini AI** via REST (same API key, same model)
- **Google OAuth 2.0** (same client ID/secret)
- **OkHttp** for outbound HTTP calls

## Project Structure
```
springboot-backend/
├── pom.xml
├── run.bat                          ← double-click to start
└── src/main/java/com/bidflow/
    ├── BidflowApplication.java
    ├── config/
    │   ├── MongoConfig.java         ← enables @CreatedDate / @LastModifiedDate
    │   └── SecurityConfig.java      ← CORS, JWT filter, public routes
    ├── controller/
    │   ├── AuthController.java      ← /api/auth/*
    │   ├── GoogleAuthController.java← /api/auth/google/*
    │   ├── BidController.java       ← /api/bids/*
    │   ├── NotificationController.java ← /api/notifications/*
    │   └── AiController.java        ← /api/ai/*
    ├── dto/                         ← Request/Response DTOs
    ├── model/                       ← MongoDB documents (User, Bid, Comment, Notification)
    ├── repository/                  ← Spring Data MongoDB repositories
    ├── security/
    │   ├── JwtUtil.java             ← token generation & validation
    │   ├── JwtAuthFilter.java       ← Bearer token + demo-token support
    │   └── AuthHelper.java          ← get current user from SecurityContext
    └── service/
        ├── GeminiService.java       ← Gemini REST API calls
        └── NotificationService.java ← notification helpers
```

## Running the Backend

### Option 1 — Double-click `run.bat`
Just double-click `run.bat` in this folder.

### Option 2 — Command line (if Maven is in PATH)
```bash
mvn spring-boot:run
```

### Option 3 — IntelliJ IDEA
Open this folder as a Maven project and run `BidflowApplication.java`.

## API Endpoints (identical to Node.js)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/profile | Get profile |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/change-password | Change password |
| GET | /api/auth/users | Get all users (Manager/Admin) |
| GET | /api/auth/google | Google OAuth initiate |
| GET | /api/auth/google/callback | Google OAuth callback |
| GET | /api/bids | Get all bids |
| POST | /api/bids | Create bid |
| GET | /api/bids/analytics | Analytics (Manager/Admin) |
| GET | /api/bids/my-bids | My bids |
| GET | /api/bids/employees/list | Employee list |
| GET | /api/bids/:id | Get bid |
| PUT | /api/bids/:id | Update bid |
| DELETE | /api/bids/:id | Delete bid |
| PATCH | /api/bids/:id/status | Update status |
| PATCH | /api/bids/:id/assign | Assign employee |
| PATCH | /api/bids/:id/verify | Verify bid |
| PATCH | /api/bids/:id/progress | Update progress |
| PATCH | /api/bids/:id/submit-completion | Submit completion |
| PATCH | /api/bids/:id/final-approval | Final approval |
| POST | /api/bids/:id/feedback | Client feedback |
| GET | /api/bids/:id/tracking | Get tracking |
| GET | /api/bids/:id/history | Get history |
| POST | /api/bids/:id/documents | Upload document |
| GET | /api/bids/:id/comments | Get comments |
| POST | /api/bids/:id/comments | Add comment |
| POST | /api/bids/bulk/status | Bulk status update |
| GET | /api/notifications | Get notifications |
| PATCH | /api/notifications/read-all | Mark all read |
| PATCH | /api/notifications/:id/read | Mark one read |
| DELETE | /api/notifications/:id | Delete notification |
| POST | /api/ai/chat | AI chat |
| POST | /api/ai/sentiment | Sentiment analysis |
| POST | /api/ai/summary-text | Summarize text |
| POST | /api/ai/summary/:bidId | Generate bid summary |
| GET | /api/ai/predict/:bidId | Win probability |
| POST | /api/ai/priority/:bidId | Assign priority |
| GET | /api/ai/recommendations/:bidId | Recommendations |
| POST | /api/ai/duplicates | Duplicate detection |
| GET | /api/health | Health check |

## Frontend Configuration
The frontend already points to `http://localhost:8080/api` — no changes needed.  
Just stop the Node.js backend and start this Spring Boot backend on the same port 8080.
