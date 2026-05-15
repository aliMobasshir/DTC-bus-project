const express = require('express');
const { Schedule } = require('../models/index');
const { generateSchedule } = require('../services/scheduler');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// GET schedules for today
router.get('/', async (req, res) => {
  try {
    const { date, status, route } = req.query;
    const filter = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: d, $lte: end };
    } else {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const end = new Date(today); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: today, $lte: end };
    }
    if (status) filter.status = status;
    if (route) filter.route = route;

    const schedules = await Schedule.find(filter)
      .populate('bus', 'busId type registrationNo')
      .populate('driver', 'name driverId phone')
      .populate('route', 'routeNo name startStop endStop stops totalDistance avgDuration')
      .sort({ departureTime: 1 })
      .limit(100);

    res.json(schedules);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET schedule stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(today); end.setHours(23, 59, 59, 999);
    const dateFilter = { date: { $gte: today, $lte: end } };

    const [total, running, completed, delayed, cancelled] = await Promise.all([
      Schedule.countDocuments(dateFilter),
      Schedule.countDocuments({ ...dateFilter, status: 'running' }),
      Schedule.countDocuments({ ...dateFilter, status: 'completed' }),
      Schedule.countDocuments({ ...dateFilter, status: 'delayed' }),
      Schedule.countDocuments({ ...dateFilter, status: 'cancelled' })
    ]);

    const onTime = completed > 0 ? Math.round(((completed - delayed) / completed) * 100) : 87;
    res.json({ total, running, completed, delayed, cancelled, onTimeRate: onTime });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST generate schedule
router.post('/generate', protect, async (req, res) => {
  try {
    const { date } = req.body;
    const result = await generateSchedule(date ? new Date(date) : new Date());
    req.app.get('io').emit('schedule-generated', result);
    res.json({ message: 'Schedule generated successfully', ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH update schedule status
router.patch('/:id', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('bus driver route');
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    req.app.get('io').emit('schedule-update', schedule);
    res.json(schedule);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
