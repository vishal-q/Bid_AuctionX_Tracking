# 🏆 BidFlow — AuctionX Bid Management System

<div align="center">

![BidFlow Banner](frontend/src/assets/hero.png)

### 🚀 **[▶ LIVE DEMO — Click Here to Open](https://bidflow-frontend-jeeu.onrender.com)**

> _Full-stack Industrial Bid Management Platform with AI, Real-time Notifications, Maps & more_

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Click_Here-brightgreen?style=for-the-badge)](https://bidflow-frontend-jeeu.onrender.com)
[![Backend API](https://img.shields.io/badge/⚙️_Backend_API-Live-blue?style=for-the-badge)](https://bid-auctionx-tracking.onrender.com/api/health)
[![Documentation](https://img.shields.io/badge/📄_Documentation-PDF-red?style=for-the-badge)](https://github.com/vishal-q/Bid_AuctionX_Tracking/blob/main/BidFlow_Documentation.pdf)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/vishal-q/Bid_AuctionX_Tracking)

</div>

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@bidflow.com | Admin@123 |
| **Manager** | manager@bidflow.com | Manager@123 |
| **Employee** | employee@bidflow.com | Employee@123 |
| **Client** | client@bidflow.com | Client@123 |

> ⚡ First load may take **30–60 seconds** (Render free tier cold start)

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Assistant** | Gemini-powered chat, win probability prediction, sentiment analysis |
| 📊 **Dashboard** | Real-time bid analytics, revenue tracking, KPI cards |
| 🗺️ **Live Map** | OpenStreetMap integration for team location tracking |
| 🔔 **Notifications** | Real-time WebSocket notifications for all bid activities |
| 💳 **Subscriptions** | 4-tier plan system (Free / Basic / Pro / Enterprise) |
| 👥 **Multi-Role** | Admin, Manager, Employee, Client roles with permissions |
| 🌐 **Multilingual** | English, Hindi, Arabic support |
| 🌙 **Dark/Light Mode** | Full theme support |
| 🔐 **Auth** | JWT + Google OAuth login |
| 📧 **OTP Email** | Email-based OTP verification |
| 🖥️ **SSH Terminal** | Built-in WebSocket SSH terminal |

---

## 🛠️ Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- Zustand (state management)
- React Query
- Recharts, Leaflet, xterm.js
- Framer Motion

**Backend**
- Spring Boot 3.2.5 (Java 17)
- MongoDB Atlas
- Spring Security + JWT
- WebSocket (STOMP)
- JSch (SSH)
- Gemini / Groq AI API

**Deployment**
- Frontend → Render Static Site
- Backend → Render Web Service (Docker)
- Database → MongoDB Atlas (Cloud)

---

## 📁 Project Structure

```
Bid_AuctionX_Tracking/
├── frontend/          # React + Vite frontend
├── springboot-backend/ # Spring Boot backend
└── README.md
```

---

## 🚀 Run Locally

**Backend:**
```bash
cd springboot-backend
mvn spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

<div align="center">

**Made with ❤️ | BidFlow AuctionX Tracking**

[![Live Demo](https://img.shields.io/badge/🌐_Open_Live_Demo-brightgreen?style=for-the-badge)](https://bidflow-frontend-jeeu.onrender.com)

</div>
