const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const { protect } = require('../middleware/auth');

// GET all buses
router.get('/', async (req, res) => {
  try {
    const { status, depot, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (depot) filter.depot = depot;
    if (type) filter.type = type;
    const buses = await Bus.find(filter).populate('depot', 'name location').populate('currentRoute', 'routeNo name').populate('currentDriver', 'name driverId');
    res.json(buses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET bus stats summary
router.get('/stats', async (req, res) => {
  try {
    const [total, active, idle, maintenance, breakdown, dispatched] = await Promise.all([
      Bus.countDocuments(),
      Bus.countDocuments({ status: 'active' }),
      Bus.countDocuments({ status: 'idle' }),
      Bus.countDocuments({ status: 'maintenance' }),
      Bus.countDocuments({ status: 'breakdown' }),
      Bus.countDocuments({ status: 'dispatched' })
    ]);
    res.json({ total, active, idle, maintenance, breakdown, dispatched, onRoute: active + dispatched });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single bus
router.get('/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('depot').populate('currentRoute').populate('currentDriver');
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    res.json(bus);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create bus
router.post('/', protect, async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json(bus);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PATCH update bus status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const bus = await Bus.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    req.app.get('io').emit('bus-status-update', { busId: bus.busId, status });
    res.json(bus);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// GET live locations
router.get('/live/locations', async (req, res) => {
  try {
    const buses = await Bus.find({ status: { $in: ['active', 'dispatched'] } })
      .select('busId location status type currentRoute')
      .populate('currentRoute', 'routeNo');
    res.json(buses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
