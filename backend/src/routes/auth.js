// ─── auth.js ──────────────────────────────────────────────────────────────────
const express = require('express');

const authRouter = express.Router();
const { User } = require('../models/index');
const { generateToken, hashPassword, comparePassword, protect } = require('../middleware/auth');

authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already exists' });
    const hashed = await hashPassword(password);
    const user = await User.create({ name, email, password: hashed, role: role || 'operator' });
    res.status(201).json({ token: generateToken(user._id), user: { id: user._id, name, email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await comparePassword(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: generateToken(user._id), user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

authRouter.get('/me', protect, (req, res) => res.json(req.user));

module.exports = authRouter;
