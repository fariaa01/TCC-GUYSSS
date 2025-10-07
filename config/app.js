const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const security = require('../src/infrastructure/middlewares/security');
const tourFlag = require('../src/infrastructure/middlewares/tourFlag');
const requireCliente = require('../src/infrastructure/middlewares/requireCliente');

const app = express();

app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(security);

app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo_super_secreto',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../src/presentation/views'));
app.use(express.static(path.join(__dirname, '../public')));

app.use(tourFlag);

app.use((req, res, next) => {
  res.locals.usuarioId   = req.session.userId || null;
  res.locals.clienteId   = req.session.clienteId || null;
  res.locals.empresaNome = (req.session?.empresa?.nome)
                        || (req.session?.empresaNome)
                        || 'Minha Empresa';
  next();
});

app.use('/tour', require('../src/infrastructure/routes/sistema/tour'));
app.use('/', require('../src/infrastructure/routes/usuarios/auth'));
app.use('/cardapio', require('../src/infrastructure/routes/vendas/cardapio'));
app.use('/menu', require('../src/infrastructure/routes/vendas/menu'));
app.use('/relatorios', require('../src/infrastructure/routes/sistema/relatorios'));
app.use('/empresa', require('../src/infrastructure/routes/sistema/empresa'));
app.use('/dashboard', require('../src/infrastructure/routes/sistema/dashboard'));
app.use('/funcionarios', require('../src/infrastructure/routes/sistema/funcionario'));
app.use('/estoque', require('../src/infrastructure/routes/sistema/estoque'));
app.use('/restaurantes', require('../src/infrastructure/routes/vendas/restaurantes'));
app.use('/financeiro', require('../src/infrastructure/routes/sistema/financeiro'));
app.use('/produtos', require('../src/infrastructure/routes/sistema/produto'));
app.use('/fornecedores', require('../src/infrastructure/routes/sistema/fornecedores'));
app.use('/dados-fornecedor', require('../src/infrastructure/routes/sistema/dados-fornecedor'));
app.use('/gastos-fixos', require('../src/infrastructure/routes/sistema/gastos-fixo'));
app.use('/pedidos', require('../src/infrastructure/routes/vendas/pedido'));
app.use('/carrinho', require('../src/infrastructure/routes/vendas/carrinho'));
app.use('/', require('../src/infrastructure/routes/usuarios/clienteAuthRoutes'));

app.get('/produto/:id', require('../src/controllers/sistema/estoque/estoqueController').visualizar);

app.get('/checkout', requireCliente, (req, res) => {
  res.render('vendas/checkout', {
    clienteId: req.session.clienteId
  });
});

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.use((req, res) => {
  res.status(404);
  try {
    return res.render('404');
  } catch (e) {
    if (req.accepts('json')) return res.json({ error: 'Not found' });
    return res.type('txt').send('Not found');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
