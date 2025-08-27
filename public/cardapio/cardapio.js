document.querySelectorAll('.adicionar-ao-carrinho').forEach(botao => {
    botao.addEventListener('click', async(event) => {
        event.preventDefault();
        const itemId = botao.getAttribute('data-item-id');

        try {
            const response = await fetch('/carrinho', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ item_id: itemId })
            });

            const result = await response.json();
            if (result.ok) {
                alert(result.msg);
                document.getElementById('qtd-carrinho').innerText = result.qtdCarrinho;
            } else {
                alert('Erro: ' + result.msg);
            }
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            alert('Erro ao adicionar ao carrinho. Tente novamente.');
        }
    });
});