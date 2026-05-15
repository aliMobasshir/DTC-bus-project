const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  driverId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  licenseNo: { type: String, required: true, unique: true },
  licenseExpiry: { type: Date, required: true },
  depot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', required: true },
  status: {
    type: String,
    enum: ['available', 'on-duty', 'off-duty', 'leave', 'suspended'],
    default: 'available'
  },
  currentBus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
  shiftStart: { type: String, default: '06:00' },
  shiftEnd: { type: String, default: '14:00' },
  shiftType: { type: String, enum: ['morning', 'afternoon', 'night'], default: 'morning' },
  hoursWorkedToday: { type: Number, default: 0 },
  totalTrips: { type: Number, default: 0 },
  rating: { type: Number, default: 4.0, min: 1, max: 5 },
  joinDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
