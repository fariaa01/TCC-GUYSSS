function linhaItem(it) {
  const totalItem = Number(it.preco) * (Number(it.qty) || 0);
  return `
    <div class="item" data-id="${it.id}">
      <img src="${it.imagem || '/img/no-photo.png'}" alt="${it.nome}">
      <div class="info">
        <span class="nome">${it.nome}</span>
        <span class="preco-unit">${money(it.preco)} / un.</span>
      </div>
      <div class="acoes">
        <button class="menos">−</button>
        <input type="number" min="1" value="${it.qty}">
        <button class="mais">+</button>
        <button class="btn-remover">🗑️</button>
      </div>
    </div>
  `;
}
