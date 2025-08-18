    const modal = document.getElementById("modalProduto");
    const btnAbrir = document.getElementById("btnNovoProduto");
    const btnFechar = document.getElementById("fecharModal");
    btnAbrir.addEventListener("click", () => modal.style.display = "flex");
    btnFechar.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

    const modalCadastro = document.getElementById("modalCadastroProduto");
    const btnAbrirCadastro = document.getElementById("btnCadastrarProduto");
    const btnFecharCadastro = document.getElementById("fecharModalCadastro");
    btnAbrirCadastro.addEventListener("click", () => modalCadastro.style.display = "flex");
    btnFecharCadastro.addEventListener("click", () => modalCadastro.style.display = "none");
    window.addEventListener("click", (e) => { if (e.target === modalCadastro) modalCadastro.style.display = "none"; });

    const modalFornecedor = document.getElementById("modalCadastroFornecedor");
    const btnAbrirFornecedor = document.getElementById("btnCadastrarFornecedor");
    const btnFecharFornecedor = document.getElementById("fecharModalFornecedor");
    btnAbrirFornecedor.addEventListener("click", () => modalFornecedor.style.display = "flex");
    btnFecharFornecedor.addEventListener("click", () => modalFornecedor.style.display = "none");
    window.addEventListener("click", (e) => { if (e.target === modalFornecedor) modalFornecedor.style.display = "none"; });

    function confirmarExclusao(id) {
      Swal.fire({
        title: 'Tem certeza?',
        text: "Deseja realmente excluir este produto?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = `/estoque/delete/${id}`;
        }
      });
    }
    window.confirmarExclusao = confirmarExclusao;

    document.getElementById("buscaProduto").addEventListener("input", function () {
      const termo = this.value.toLowerCase();
      const linhas = document.querySelectorAll("tbody tr");
      linhas.forEach(linha => {
        const cell = linha.querySelector("td[data-label='Produto']");
        const nomeProduto = (cell?.textContent || "").toLowerCase();
        linha.style.display = nomeProduto.includes(termo) ? "" : "none";
      });
    });

    (function () {
      const params = new URLSearchParams(location.search);
      const ok = params.get('ok');
      const msg = params.get('msg');
      if (ok === '1' && msg) {
        Swal.fire({ icon: 'success', title: 'Tudo certo!', text: msg });
        history.replaceState({}, document.title, location.pathname);
      } else if (ok === '0' && msg) {
        Swal.fire({ icon: 'error', title: 'Ops...', text: msg });
        history.replaceState({}, document.title, location.pathname);
      }
    })();

    (function () {
      const selectProduto = document.getElementById('selectProdutoCadastro');
      const selectCategoria = document.getElementById('selectCategoria');
      const selectUnidade = document.getElementById('selectUnidade');

      function applyDefaultsFromOption(opt) {
        if (!opt) return;
        const cat = opt.getAttribute('data-categoria') || '';
        const uni = opt.getAttribute('data-unidade') || '';
        if (cat && !selectCategoria.value) selectCategoria.value = cat;
        if (uni && !selectUnidade.value) selectUnidade.value = uni;
      }

      selectProduto?.addEventListener('change', function () {
        const opt = this.selectedOptions?.[0];
        applyDefaultsFromOption(opt);
      });

      if (selectProduto && selectProduto.value) {
        applyDefaultsFromOption(selectProduto.selectedOptions?.[0]);
      }
    })();

    (function () {
      const cnpj = document.getElementById('cnpjFornecedor');
      const tel = document.getElementById('telefoneFornecedor');

      IMask(cnpj, { mask: '00.000.000/0000-00' });
      IMask(tel, { mask: '(00) 00000-0000' });
    })();