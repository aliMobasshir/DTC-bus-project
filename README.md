# 🚌 DTC Command — Automated Bus Scheduling & Reroute Management

A full-stack MERN MVP for automating Delhi Transport Corporation's bus operations.

---

## 📁 Project Structure

```
dtc-mvp/
├── backend/              ← Node.js + Express API
│   ├── src/
│   │   ├── models/       ← Mongoose schemas (Bus, Driver, Route, Schedule, etc.)
│   │   ├── routes/       ← REST API endpoints
│   │   ├── services/
│   │   │   ├── scheduler.js    ← 🧠 Core scheduling algorithm (Greedy + CSP)
│   │   │   └── gpsSimulator.js ← 🛰 Simulated GPS bus movement
│   │   ├── middleware/   ← JWT auth
│   │   └── utils/seed.js ← Database seeder (real DTC routes + depots)
│   └── package.json
├── frontend/             ← React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   ← Live map + stats + alerts
│   │   │   ├── Schedules.jsx   ← Duty roster + auto-generate
│   │   │   ├── Incidents.jsx   ← Incident reporting + reroute
│   │   │   ├── Fleet.jsx       ← Bus & driver registry
│   │   │   ├── Passenger.jsx   ← Public route search (no login needed)
│   │   │   └── Login.jsx
│   │   ├── context/
│   │   │   ├── SocketContext.jsx  ← Real-time WebSocket state
│   │   │   └── AuthContext.jsx
│   │   └── utils/api.js          ← Axios API client
│   └── package.json
├── render.yaml           ← Render.com deployment config
└── README.md
```

---

## ⚡ Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free) — or local MongoDB

### Step 1 — Clone & Install
```bash
git clone <your-repo>
cd dtc-mvp
npm run install:all
```

### Step 2 — Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env and add your MongoDB URI
```

**.env:**
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/dtc_mvp
JWT_SECRET=any_random_secret_key_here
FRONTEND_URL=http://localhost:5173
```

### Step 3 — Seed the Database
```bash
npm run seed
```
This creates:
- 8 real Delhi depots (Kashmere Gate, Rohini, Dwarka, etc.)
- 24 buses (CNG + EV)
- 20 drivers with shifts
- 8 real DTC routes with actual stop coordinates
- Admin + Operator login accounts

### Step 4 — Configure Frontend
```bash
cd frontend
cp .env.example .env
# .env already works for local — no changes needed
```

### Step 5 — Run Both
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open: **http://localhost:5173**

---

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dtc.delhi.gov.in | admin123 |
| Operator | operator@dtc.delhi.gov.in | operator123 |

Passenger app (no login): **http://localhost:5173/passenger**

---

## 🚀 Deploy to Production

### Backend → Render.com (Free Tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set root directory: `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variables:
   - `MONGODB_URI` → your Atlas URI
   - `JWT_SECRET` → any random string
   - `FRONTEND_URL` → your Vercel URL

### Frontend → Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Set root directory: `frontend`
4. Add environment variable:
   - `VITE_API_URL` → `https://your-render-app.onrender.com/api`
   - `VITE_SOCKET_URL` → `https://your-render-app.onrender.com`
5. Deploy!

---

## 🛠 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/buses` | All buses (filterable) |
| GET | `/api/buses/stats` | Bus count summary |
| GET | `/api/buses/live/locations` | Live GPS positions |
| GET | `/api/schedules` | Today's schedule |
| POST | `/api/schedules/generate` | **Run scheduling engine** |
| GET | `/api/routes/search?from=X&to=Y` | Passenger route search |
| POST | `/api/incidents` | Report incident (triggers reroute) |
| PATCH | `/api/incidents/:id` | Resolve incident |
| GET | `/api/depots` | All depots with bus counts |
| GET | `/api/drivers` | All drivers |

---

## 🧠 How the Scheduling Algorithm Works

File: `backend/src/services/scheduler.js`

1. **Load** all active routes sorted by priority (busiest routes first)
2. **For each route**, calculate number of trips needed based on frequency and operating hours
3. **Find available bus** at the route's depot (not in maintenance)
4. **Find available driver** at the same depot (check: within shift hours, < 8 hrs worked today)
5. **Assign** bus + driver → create Schedule document
6. **Mark both** as occupied for that time slot
7. **Fallback** → log conflict if no bus or driver available

---

## 🛰 How GPS Simulation Works

File: `backend/src/services/gpsSimulator.js`

- Runs every **4 seconds** via `setInterval`
- Loads all `running`/`scheduled` trips for today
- Moves each bus **linearly between its route stops** using `lerp()`
- Emits `bus-location-update` via **Socket.IO** to all connected clients
- Frontend `SocketContext` receives updates and re-renders Leaflet markers

---

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Maps | React-Leaflet + OpenStreetMap |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO (WebSockets) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deployment | Vercel (FE) + Render (BE) + MongoDB Atlas (DB) |

---

## 🔮 What to Build Next

- [ ] ML demand prediction (Prophet/scikit-learn)
- [ ] Driver mobile app (React Native)
- [ ] PostGIS integration for geospatial queries
- [ ] Analytics dashboard with Recharts
- [ ] SMS notifications via Twilio
- [ ] EV charging schedule optimizer
