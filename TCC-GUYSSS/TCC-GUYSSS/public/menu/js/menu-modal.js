(function () {
  const btnAbrirCategoria = document.getElementById("btnAbrirCategoria");
  const modalCategoria = document.getElementById("modalCategoria");
  const modalPedido = document.getElementById("modalPedido");
  const fecharCategoria = document.getElementById("fecharCategoria");
  const fecharModal = document.getElementById("fecharModal");
  const selectCategoria = document.getElementById("selectCategoria");
  const inputCategoria = document.getElementById("inputCategoria");
  const camposDinamicos = document.getElementById("camposDinamicos");
  const tituloModal = document.getElementById("tituloModal");

  if (!btnAbrirCategoria) return;

  btnAbrirCategoria.addEventListener('click', () => modalCategoria.style.display = "block");
  fecharCategoria.addEventListener('click', () => modalCategoria.style.display = "none");
  fecharModal.addEventListener('click', () => modalPedido.style.display = "none");

  window.addEventListener('click', (event) => {
    if (event.target === modalCategoria) modalCategoria.style.display = "none";
    if (event.target === modalPedido) modalPedido.style.display = "none";
  });

  const btnAvancar = document.getElementById("btnAvancar");
  btnAvancar.addEventListener('click', () => {
    const categoria = selectCategoria.value;
    if (!categoria) {
      alert("Selecione uma categoria.");
      return;
    }

    inputCategoria.value = categoria;
    tituloModal.innerText = "Novo Prato - " + categoria.charAt(0).toUpperCase() + categoria.slice(1);
    camposDinamicos.innerHTML = "";

    if (categoria === "bebida") {
      camposDinamicos.innerHTML = `
        <input type="number" name="volume" placeholder="Volume (ml)" class="form-box-input" />`;
    } else if (categoria === "lanche") {
      camposDinamicos.innerHTML = `
        <input type="text" name="tamanho" placeholder="Tamanho do lanche" />
        <input type="text" name="acompanhamento" placeholder="Acompanhamento" />`;
    }

    modalCategoria.style.display = "none";
    modalPedido.style.display = "block";
  });
})();
