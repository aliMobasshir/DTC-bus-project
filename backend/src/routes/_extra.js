// tracking.js
const express = require('express');
const trackRouter = express.Router();
const { Schedule } = require('../models/index');
const Bus = require('../models/Bus');

// GET live bus on a specific route (for passenger)
trackRouter.get('/route/:routeId', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const end = new Date(today); end.setHours(23,59,59,999);

    const schedules = await Schedule.find({
      route: req.params.routeId,
      date: { $gte: today, $lte: end },
      status: { $in: ['running', 'scheduled'] }
    }).populate('bus', 'busId location type capacity status');

    res.json(schedules);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET bus current location by busId string
trackRouter.get('/bus/:busId', async (req, res) => {
  try {
    const bus = await Bus.findOne({ busId: req.params.busId })
      .select('busId location status type capacity currentRoute currentDriver')
      .populate('currentRoute', 'routeNo name stops')
      .populate('currentDriver', 'name phone');
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    res.json(bus);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = trackRouter;

// ─────────────────────────────────────────────────────────────────────────────

// depots.js
const depotRouter = express.Router();
const { Depot } = require('../models/index');
const Bus2 = require('../models/Bus');
const { protect } = require('../middleware/auth');

depotRouter.get('/', async (req, res) => {
  try {
    const depots = await Depot.find();
    // Enrich with bus counts
    const enriched = await Promise.all(depots.map(async d => {
      const [active, idle, maintenance] = await Promise.all([
        Bus2.countDocuments({ depot: d._id, status: { $in: ['active', 'dispatched'] } }),
        Bus2.countDocuments({ depot: d._id, status: 'idle' }),
        Bus2.countDocuments({ depot: d._id, status: 'maintenance' })
      ]);
      return { ...d.toObject(), buses: { active, idle, maintenance, total: active + idle + maintenance } };
    }));
    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

depotRouter.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Depot.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Export both as separate files trick using module.exports object
module.exports = { trackRouter, depotRouter };
