const express = require('express');
const { Incident } = require('../models/index');
const Bus = require('../models/Bus');
const { Schedule } = require('../models/index');
const { findReplacementBus } = require('../services/scheduler');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET all incidents
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const incidents = await Incident.find(filter)
      .populate('bus', 'busId registrationNo type depot')
      .populate('driver', 'name driverId')
      .populate('route', 'routeNo name')
      .populate('replacementBus', 'busId')
      .sort({ reportedAt: -1 })
      .limit(50);
    res.json(incidents);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET incident stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [open, inProgress, resolvedToday, breakdowns] = await Promise.all([
      Incident.countDocuments({ status: 'open' }),
      Incident.countDocuments({ status: 'in-progress' }),
      Incident.countDocuments({ status: 'resolved', resolvedAt: { $gte: today } }),
      Incident.countDocuments({ type: 'breakdown', status: { $ne: 'resolved' } })
    ]);
    res.json({ open, inProgress, resolvedToday, breakdowns, total: open + inProgress });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST report new incident
router.post('/', protect, async (req, res) => {
  try {
    const incident = await Incident.create(req.body);

    // If breakdown, mark bus and try to find replacement
    if (req.body.type === 'breakdown' && req.body.bus) {
      const bus = await Bus.findByIdAndUpdate(req.body.bus, { status: 'breakdown' }, { new: true });
      req.app.get('io').emit('bus-status-update', { busId: bus?.busId, status: 'breakdown', incidentId: incident._id });

      // Find replacement bus
      if (bus) {
        const replacement = await findReplacementBus(bus._id, bus.depot);
        if (replacement) {
          await Incident.findByIdAndUpdate(incident._id, { replacementBus: replacement._id });
          await Bus.findByIdAndUpdate(replacement._id, { status: 'dispatched' });
          req.app.get('io').emit('reroute-suggestion', {
            incidentId: incident._id,
            affectedBus: bus.busId,
            replacementBus: replacement.busId,
            message: `Replacement bus ${replacement.busId} dispatched from ${replacement.depot?.name || 'depot'}`
          });
        }
      }
    }

    // Cancel the affected schedule
    if (req.body.bus) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      await Schedule.updateMany(
        { bus: req.body.bus, date: { $gte: today }, status: { $in: ['scheduled', 'running'] } },
        { status: 'cancelled' }
      );
    }

    const populated = await Incident.findById(incident._id)
      .populate('bus', 'busId').populate('driver', 'name').populate('route', 'routeNo name');

    req.app.get('io').emit('new-incident', populated);
    res.status(201).json(populated);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PATCH resolve/update incident
router.patch('/:id', protect, async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.body.status === 'resolved') update.resolvedAt = new Date();

    const incident = await Incident.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('bus driver route replacementBus');

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    // If resolved, restore bus status
    if (req.body.status === 'resolved' && incident.bus) {
      await Bus.findByIdAndUpdate(incident.bus._id, { status: 'idle' });
    }

    req.app.get('io').emit('incident-update', incident);
    res.json(incident);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
