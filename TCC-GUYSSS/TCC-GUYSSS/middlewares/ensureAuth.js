module.exports = (req, res, next) => {
  const autenticado = req.session && req.session.userId;

  if (autenticado) return next();

  const wantsJson =
    (req.headers.accept || '').includes('application/json') ||
    (req.headers['content-type'] || '').includes('application/json') ||
    req.xhr;

  if (wantsJson) {
    return res.status(401).json({ ok: false, msg: 'Não autenticado.' });
  }

  return res.redirect('/login');
};
