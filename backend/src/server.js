const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/buses',     require('./routes/buses'));
app.use('/api/drivers',   require('./routes/drivers'));
app.use('/api/routes',    require('./routes/routes'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/tracking',  require('./routes/tracking'));
app.use('/api/depots',    require('./routes/depots'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    startGPSSimulator(io);
    scheduleDailyAutoSchedule();
  })
  .catch(err => console.error('MongoDB error:', err));

// ─── GPS Simulator ────────────────────────────────────────────────────────────
function startGPSSimulator(io) {
  const { simulateGPS } = require('./services/gpsSimulator');
  setInterval(() => simulateGPS(io), 4000);
  console.log('🛰  GPS simulator started (4s interval)');
}

// ─── Auto-schedule cron (runs 2 AM daily) ─────────────────────────────────────
function scheduleDailyAutoSchedule() {
  cron.schedule('0 2 * * *', async () => {
    const { generateSchedule } = require('./services/scheduler');
    try {
      await generateSchedule();
      console.log('✅ Auto-schedule generated at 2 AM');
    } catch (e) {
      console.error('Auto-schedule failed:', e);
    }
  });
}

// ─── Socket events ───────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
  socket.on('join-room', (room) => socket.join(room));
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚌 DTC Backend running on port ${PORT}`));
