const express = require('express');
const rateLimit = require('express-rate-limit');
const { findByEmailAndPassword } = require('../lib/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Massa intents. Torna a provar en 15 minuts.' },
});

// POST /api/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Cal un email i una contrasenya' });
  }

  try {
    const profile = await findByEmailAndPassword(email, password);
    if (!profile) {
      return res.status(401).json({ error: 'Email o contrasenya incorrectes' });
    }

    req.session.profile = profile;
    res.json({ ok: true, email: profile.email, first_name: profile.first_name });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ error: 'Error intern. Torna a provar.' });
  }
});

// POST /api/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/me
router.get('/me', (req, res) => {
  const p = req.session?.profile;
  if (!p) return res.status(401).json({ error: 'No autenticat' });
  res.json({ email: p.email, first_name: p.first_name });
});

module.exports = router;
