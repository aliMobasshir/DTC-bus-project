const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  sequence: { type: Number, required: true },
  estimatedMinutes: { type: Number, default: 0 } // minutes from start
});

const routeSchema = new mongoose.Schema({
  routeNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  startStop: { type: String, required: true },
  endStop: { type: String, required: true },
  stops: [stopSchema],
  totalDistance: { type: Number, required: true }, // km
  avgDuration: { type: Number, required: true },   // minutes
  frequency: { type: Number, default: 20 },         // minutes between buses
  operatingHours: {
    start: { type: String, default: '05:30' },
    end: { type: String, default: '23:00' }
  },
  depot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', required: true },
  status: { type: String, enum: ['active', 'suspended', 'modified'], default: 'active' },
  priority: { type: Number, default: 1 }, // 1=low, 5=high (used in scheduling)
  dailyPassengers: { type: Number, default: 500 }
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
