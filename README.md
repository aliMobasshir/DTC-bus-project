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
│   │   │   ├── scheduler.js    ←  Core scheduling algorithm (Greedy + CSP)
│   │   │   └── gpsSimulator.js ←  Simulated GPS bus movement
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
└── README.md
```

---


- 8 real Delhi depots (Kashmere Gate, Rohini, Dwarka, etc.)
- 24 buses (CNG + EV)
- 20 drivers with shifts
- 8 real DTC routes with actual stop coordinates
- Admin + Operator login accounts



## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dtc.delhi.gov.in | admin123 |
| Operator | operator@dtc.delhi.gov.in | operator123 |

Passenger app (no login): **http://localhost:5173/passenger**

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


---


