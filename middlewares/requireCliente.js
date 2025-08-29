module.exports = function requireCliente(req, res, next) {
  if (!req.session?.clienteId) {
    if (req.accepts(['html', 'json']) === 'html') {
      const nextUrl = encodeURIComponent(req.originalUrl || '/checkout');
      return res.redirect(`/cliente/login?next=${nextUrl}`);
    }
    return res.status(401).json({ erro: 'Cliente não autenticado', needLogin: true });
  }
  next();
};
