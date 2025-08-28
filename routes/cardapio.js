const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/', (req, res) => res.redirect('/restaurantes'));
router.get('/u/:usuarioId', menuController.publicoPorUsuario);

router.get('/r/:restauranteId', menuController.porRestaurante);

document.querySelectorAll('.adicionar-carrinho').forEach(botao => {
    botao.addEventListener('click', async() => {
        const itemId = botao.getAttribute('data-item-id');
        try {
            const response = await fetch('/carrinho', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: itemId })
            });
            const result = await response.json();
            if (result.ok) {
                alert('Item adicionado ao carrinho! Total de itens: ' + result.qtdCarrinho);
            } else {
                alert('Erro: ' + result.msg);
            }
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            alert('Erro ao adicionar ao carrinho. Tente novamente.');
        }
    });
});

const postarNovoPrato = async(event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    try {
        const response = await fetch('/cardapio', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.ok) {
            alert('Prato adicionado com sucesso!');
            form.reset();
        } else {
            alert('Erro: ' + result.msg);
        }
    } catch (error) {
        console.error('Erro ao adicionar prato:', error);
        alert('Erro ao adicionar prato. Tente novamente.');
    }
};

getSelection('#form-novo-prato').addEventListener('submit', postarNovoPrato);




module.exports = router;