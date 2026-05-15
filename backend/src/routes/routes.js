const express = require('express');
const Route = require('../models/Route');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET all routes
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find(req.query.status ? { status: req.query.status } : {})
      .populate('depot', 'name location');
    res.json(routes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET route search for passenger (from/to fuzzy match on stop names)
router.get('/search', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to are required' });

    const routes = await Route.find({ status: 'active' })
      .populate('depot', 'name');

    // Filter routes where stops contain both from and to locations
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    const results = routes.filter(route => {
      const stopNames = route.stops.map(s => s.name.toLowerCase());
      const hasFrom = stopNames.some(s => s.includes(fromLower) || fromLower.includes(s.split(' ')[0]));
      const hasTo = stopNames.some(s => s.includes(toLower) || toLower.includes(s.split(' ')[0]));
      return hasFrom || hasTo ||
        route.startStop.toLowerCase().includes(fromLower) ||
        route.endStop.toLowerCase().includes(toLower) ||
        route.name.toLowerCase().includes(fromLower) ||
        route.name.toLowerCase().includes(toLower);
    });

    // Add estimated ETA info
    const enriched = results.slice(0, 5).map(r => ({
      ...r.toObject(),
      estimatedETA: Math.floor(Math.random() * 20) + 3, // simulate ETA in minutes
      nextBusIn: Math.floor(Math.random() * 15) + 2
    }));

    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single route
router.get('/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate('depot');
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Route.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
