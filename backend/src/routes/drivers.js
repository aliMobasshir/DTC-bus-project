// ─── drivers.js ───────────────────────────────────────────────────────────────
const express = require('express');
const Driver = require('../models/Driver');
const { protect } = require('../middleware/auth');

const driverRouter = express.Router();

driverRouter.get('/', async (req, res) => {
  try {
    const { status, depot } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (depot) filter.depot = depot;
    const drivers = await Driver.find(filter).populate('depot', 'name').populate('currentBus', 'busId');
    res.json(drivers);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

driverRouter.get('/stats', async (req, res) => {
  try {
    const [total, available, onDuty, offDuty] = await Promise.all([
      Driver.countDocuments(), Driver.countDocuments({ status: 'available' }),
      Driver.countDocuments({ status: 'on-duty' }), Driver.countDocuments({ status: 'off-duty' })
    ]);
    res.json({ total, available, onDuty, offDuty });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

driverRouter.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Driver.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

driverRouter.patch('/:id', protect, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = driverRouter;
