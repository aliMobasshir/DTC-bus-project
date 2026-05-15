/**
 * GPS Simulator
 * Moves buses along their route stop coordinates every 4 seconds.
 * Emits 'bus-location-update' events via Socket.IO.
 */

const Bus = require('../models/Bus');
const { Schedule } = require('../models/index');

// In-memory state for bus movement
const busStates = new Map(); // busId -> { stopIndex, progress, routeStops, direction }

async function simulateGPS(io) {
  try {
    // Get all running/dispatched schedules with populated data
    const activeSchedules = await Schedule.find({
      status: { $in: ['running', 'scheduled'] },
      date: { $gte: startOfDay(), $lte: endOfDay() }
    })
    .populate({ path: 'bus', select: 'busId location status type' })
    .populate({ path: 'route', select: 'stops routeNo' })
    .limit(30); // cap for performance

    if (activeSchedules.length === 0) return;

    const updates = [];

    for (const schedule of activeSchedules) {
      if (!schedule.bus || !schedule.route || !schedule.route.stops.length) continue;

      const busId = schedule.bus._id.toString();
      const stops = schedule.route.stops.sort((a, b) => a.sequence - b.sequence);

      // Initialize state if first time seeing this bus
      if (!busStates.has(busId)) {
        busStates.set(busId, {
          stopIndex: 0,
          progress: 0,     // 0-1 between current stop and next
          direction: 1,    // 1 = forward, -1 = reverse (for ping-pong sim)
          delayChance: Math.random() // per-bus random delay probability
        });
      }

      const state = busStates.get(busId);
      const totalStops = stops.length;

      // Advance progress
      state.progress += 0.04 + (Math.random() * 0.02); // small random variance

      if (state.progress >= 1) {
        state.progress = 0;
        state.stopIndex = (state.stopIndex + 1) % (totalStops - 1);
      }

      // Interpolate lat/lng between current stop and next stop
      const currentStop = stops[state.stopIndex];
      const nextStop = stops[Math.min(state.stopIndex + 1, totalStops - 1)];

      const lat = lerp(currentStop.lat, nextStop.lat, state.progress);
      const lng = lerp(currentStop.lng, nextStop.lng, state.progress);
      const speed = 25 + Math.random() * 20; // 25-45 km/h

      // Occasionally introduce random delays
      let busStatus = 'active';
      if (state.delayChance < 0.08) busStatus = 'delayed'; // 8% delayed

      const locationUpdate = {
        busId: schedule.bus.busId,
        _id: busId,
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        speed: parseFloat(speed.toFixed(1)),
        routeNo: schedule.route.routeNo,
        currentStopIndex: state.stopIndex,
        nextStop: nextStop.name,
        status: busStatus,
        timestamp: new Date()
      };

      updates.push(locationUpdate);

      // Update DB every 5th tick to reduce writes
      if (Math.random() < 0.2) {
        await Bus.findByIdAndUpdate(busId, {
          'location.lat': locationUpdate.lat,
          'location.lng': locationUpdate.lng,
          'location.speed': locationUpdate.speed,
          'location.updatedAt': new Date()
        });
      }
    }

    if (updates.length > 0) {
      io.emit('bus-location-update', updates);
    }

  } catch (err) {
    console.error('GPS Simulator error:', err.message);
  }
}

// Linear interpolation
function lerp(a, b, t) { return a + (b - a) * t; }

function startOfDay() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}
function endOfDay() {
  const d = new Date(); d.setHours(23, 59, 59, 999); return d;
}

module.exports = { simulateGPS };
