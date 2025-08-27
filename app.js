const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const security = require('./middlewares/security');
const tourFlag = require('./middlewares/tourFlag');

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
});

app.use(security);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'segredo_super_secreto',
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: 'lax' }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(tourFlag);

app.use((req, res, next) => {
    res.locals.usuarioId = req.session.userId || null;
    res.locals.empresaId = req.session.empresaId || null;
    next();
});

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
app.use('/carrinho', require('./routes/carrinho'));
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