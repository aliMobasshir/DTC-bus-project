const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busId: { type: String, required: true, unique: true, uppercase: true },
  registrationNo: { type: String, required: true, unique: true },
  type: { type: String, enum: ['CNG', 'EV', 'DIESEL'], default: 'CNG' },
  capacity: { type: Number, default: 65 },
  depot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', required: true },
  status: {
    type: String,
    enum: ['active', 'idle', 'maintenance', 'breakdown', 'dispatched'],
    default: 'idle'
  },
  currentRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
  currentDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  location: {
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.2090 },
    speed: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  },
  odometer: { type: Number, default: 0 },
  lastMaintenance: { type: Date, default: Date.now },
  nextMaintenanceDue: { type: Number, default: 10000 },
  manufacturedYear: { type: Number, default: 2020 },
  ac: { type: Boolean, default: false }
}, { timestamps: true });

busSchema.virtual('needsMaintenance').get(function() {
  return this.odometer >= this.nextMaintenanceDue;
});

module.exports = mongoose.model('Bus', busSchema);
