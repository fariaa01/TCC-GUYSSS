module.exports = {
  mostrarCarrinho: (req, res) => {
    const itens = req.session.carrinho || [];
    res.render('carrinho', { itens });
  },
  limparCarrinho: (req, res) => {
    req.session.carrinho = [];
    res.redirect('/carrinho');
  },
  verCarrinho: (req, res) => {
    const itens = req.session.carrinho || [];
    const total = itens.reduce((sum, item) => sum + (item.preco * (item.quantidade || 1)), 0);
    res.render('carrinho', { itens, total });
  }
};