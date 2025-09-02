// middlewares/requireCliente.js
module.exports = function requireCliente(req, res, next) {
  // Detecta chamadas de API/fetch
  const accepts = (req.headers.accept || '').toLowerCase();
  const ctype   = (req.headers['content-type'] || '').toLowerCase();

  const isJsonFetch =
    req.xhr ||
    accepts.includes('application/json') ||
    ctype.includes('application/json');

  // Detecta se é rota do carrinho mesmo quando o middleware está montado no router
  const isCarrinho =
    (req.baseUrl && req.baseUrl.startsWith('/carrinho')) ||
    (req.originalUrl && req.originalUrl.startsWith('/carrinho'));

  if (req.session && req.session.clienteId) {
    return next();
  }

  // Para AJAX/fetch do carrinho → 401 JSON (sem redirect)
  if (isJsonFetch || isCarrinho) {
    return res.status(401).json({
      authRequired: true,
      mensagem: 'É necessário fazer login para acessar o carrinho.'
    });
  }

  // Navegação de página
  return res.redirect(302, '/login?from=carrinho');
};
