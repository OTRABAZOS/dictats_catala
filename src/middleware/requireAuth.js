function requireAuth(req, res, next) {
  if (!req.session || !req.session.profile) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'No autenticat' });
    }
    return res.redirect('/login');
  }
  next();
}

module.exports = requireAuth;
