// app.js
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const security = require('./middlewares/security');
const tourFlag = require('./middlewares/tourFlag');
const requireCliente = require('./middlewares/requireCliente');

const app = express();

// Se estiver atrás de proxy reverso (nginx, render, heroku), mantenha isso:
app.set('trust proxy', 1);

// parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// CSP nonce para inline scripts nas views
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// segurança (sua middleware custom)
app.use(security);

// sessão (garante persistência do cookie corretamente)
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo_super_secreto',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' // true em produção (HTTPS)
  }
}));

// views e estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// feature flags/tour
app.use(tourFlag);

// locals globais para as views
app.use((req, res, next) => {
  res.locals.usuarioId   = req.session.userId || null;       // se você usar para dono/admin
  res.locals.clienteId   = req.session.clienteId || null;    // login do cliente (checkout)
  res.locals.empresaNome = (req.session?.empresa?.nome)
                        || (req.session?.empresaNome)
                        || 'Minha Empresa';
  next();
});

// rotas existentes
app.use('/tour', require('./routes/tour'));
app.use('/', require('./routes/auth'));
app.use('/cardapio', require('./routes/cardapio'));
app.use('/menu', require('./routes/menu'));
app.use('/relatorios', require('./routes/relatorios'));
app.use('/empresa', require('./routes/empresa'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/funcionarios', require('./routes/funcionario'));
app.use('/estoque', require('./routes/estoque'));
app.use('/restaurantes', require('./routes/restaurantes'));
app.use('/financeiro', require('./routes/financeiro'));
app.use('/produtos', require('./routes/produto'));
app.use('/fornecedores', require('./routes/fornecedores'));
app.use('/gastos-fixos', require('./routes/gastos-fixo'));
app.use('/pedidos', require('./routes/pedido'));

// ⚠️ Carrinho: dentro de routes/carrinho.js deve haver router.use(requireCliente)
app.use('/carrinho', require('./routes/carrinho'));

// rotas de cliente (status/login/cadastro/logout) — JSON
// trocamos para o arquivo novo separado
app.use('/', require('./routes/clienteAuthRoutes'));

// página protegida de checkout (exige cliente logado)
app.get('/checkout', requireCliente, (req, res) => {
  res.render('checkout', {
    clienteId: req.session.clienteId
  });
});

// healthcheck
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// 404
app.use((req, res) => {
  res.status(404);
  try {
    return res.render('404');
  } catch (e) {
    if (req.accepts('json')) return res.json({ error: 'Not found' });
    return res.type('txt').send('Not found');
  }
});

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
