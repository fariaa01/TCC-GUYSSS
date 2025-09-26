const show = (el) => el && el.classList.remove('is-hidden');
const hide = (el) => el && el.classList.add('is-hidden');
const openModal  = (el) => el && el.classList.add('is-open');
const closeModal = (el) => el && el.classList.remove('is-open');

const modal = document.getElementById("modalProduto");
const btnAbrir = document.getElementById("btnNovoProduto");
const btnFechar = document.getElementById("fecharModal");

btnAbrir?.addEventListener("click", () => openModal(modal));
btnFechar?.addEventListener("click", () => closeModal(modal));
window.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal); });
document.getElementById("cancelarModalProduto")?.addEventListener("click", () => closeModal(modal));

const modalCadastro = document.getElementById("modalCadastroProduto");
const btnAbrirCadastro = document.getElementById("btnCadastrarProduto");
const btnFecharCadastro = document.getElementById("fecharModalCadastro");

btnAbrirCadastro?.addEventListener("click", () => openModal(modalCadastro));
btnFecharCadastro?.addEventListener("click", () => closeModal(modalCadastro));
window.addEventListener("click", (e) => { if (e.target === modalCadastro) closeModal(modalCadastro); });
document.getElementById("cancelarModalCadastroProduto")?.addEventListener("click", () => closeModal(modalCadastro));

const modalFornecedor = document.getElementById("modalCadastroFornecedor");
const btnAbrirFornecedor = document.getElementById("btnCadastrarFornecedor");
const btnFecharFornecedor = document.getElementById("fecharModalFornecedor");

btnAbrirFornecedor?.addEventListener("click", () => openModal(modalFornecedor));
btnFecharFornecedor?.addEventListener("click", () => closeModal(modalFornecedor));
window.addEventListener("click", (e) => { if (e.target === modalFornecedor) closeModal(modalFornecedor); });
document.getElementById("cancelarModalFornecedor")?.addEventListener("click", () => closeModal(modalFornecedor));

const modalEditar = document.getElementById("modalEditarEstoque");
const btnFecharEditar = document.getElementById("fecharModalEditar");

btnFecharEditar?.addEventListener("click", () => closeModal(modalEditar));
document.getElementById("cancelarModalEditar")?.addEventListener("click", () => closeModal(modalEditar));
window.addEventListener("click", (e) => { if (e.target === modalEditar) closeModal(modalEditar); });

const selectEditProduto   = document.getElementById('edit_produto');
const selectEditCategoria = document.getElementById('edit_categoria');
const selectEditUnidade   = document.getElementById('edit_unidade_medida');

function syncProdutoToFields({ force = false } = {}) {
  if (!selectEditProduto) return;
  const opt = selectEditProduto.options[selectEditProduto.selectedIndex];
  if (!opt) return;
  const cat = opt.dataset.categoria || '';
  const uni = opt.dataset.unidade   || '';
  if (force || !selectEditCategoria.value) selectEditCategoria.value = cat || selectEditCategoria.value;
  if (force || !selectEditUnidade.value)   selectEditUnidade.value   = uni || selectEditUnidade.value;
}

function selectOptionOrCreate(selectEl, value) {
  if (!selectEl) return;
  selectEl.value = value;
  if (selectEl.value !== value && value) {
    const opt = new Option(value, value, true, true);
    selectEl.add(opt);
  }
}

function ensureChangeListenerOnce() {
  if (!selectEditProduto) return;
  if (!selectEditProduto.__hasChangeListener) {
    selectEditProduto.addEventListener('change', () => syncProdutoToFields({ force: false }));
    selectEditProduto.__hasChangeListener = true;
  }
}

document.addEventListener('click', (e) => {
  const btnEditar = e.target.closest('[data-role="editar"]');
  if (btnEditar) {
    e.preventDefault();
    abrirEditarEstoque(btnEditar);
    return;
  }
  const btnExcluir = e.target.closest('[data-role="excluir"]');
  if (btnExcluir) {
    e.preventDefault();
    const id = btnExcluir.getAttribute('data-id');
    confirmarExclusao(id);
    return;
  }
});

function abrirEditarEstoque(btn) {
  const tr = btn?.closest('tr');
  if (!tr || !modalEditar) return;

  const id = tr.getAttribute('data-id') || '';
  const get = (k) => tr.getAttribute(k) || '';

  const setVal = (idEl, val) => { const el = document.getElementById(idEl); if (el) el.value = val; };
  const setHidden = (idEl, val) => { const el = document.getElementById(idEl); if (el) el.setAttribute('value', val); };

  setHidden('edit_id', id);

  const produtoAtual = get('data-produto');
  selectOptionOrCreate(selectEditProduto, produtoAtual);

  selectEditCategoria.value = get('data-categoria');
  selectEditUnidade.value = get('data-unidade_medida');
  setVal('edit_quantidade',         get('data-quantidade'));
  setVal('edit_quantidade_minima',  get('data-quantidade_minima'));
  setVal('edit_valor',              get('data-valor'));
  setVal('edit_validade',           get('data-validade'));
  setVal('edit_fornecedor',         get('data-fornecedor'));

  if (!selectEditCategoria.value || !selectEditUnidade.value) {
    syncProdutoToFields({ force: false });
  }

  ensureChangeListenerOnce();

  const form = document.getElementById('formEditarEstoque');
  if (form && id) form.setAttribute('action', `/estoque/${id}/update`);

  openModal(modalEditar);
}

function confirmarExclusao(id) {
  Swal.fire({
    title: 'Tem certeza?',
    text: "Deseja realmente excluir este produto?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    buttonsStyling: false,
    customClass: {
      popup: 'swal-popup',
      actions: 'swal-actions',
      confirmButton: 'btn btn-excluir swal-confirm',
      cancelButton: 'btn btn-voltar swal-cancel',
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = `/estoque/delete/${id}`;
    }
  });
  return false; 
}
window.confirmarExclusao = confirmarExclusao;

(function () {
  const params = new URLSearchParams(location.search);
  const ok = params.get('ok');
  const msg = params.get('msg');
  if (ok === '1' && msg) {
    Swal.fire({ icon: 'success', title: 'Tudo certo!', text: msg, buttonsStyling:false, customClass:{confirmButton:'btn btn-voltar'} });
    history.replaceState({}, document.title, location.pathname);
  } else if (ok === '0' && msg) {
    Swal.fire({ icon: 'error', title: 'Ops...', text: msg, buttonsStyling:false, customClass:{confirmButton:'btn btn-voltar'} });
    history.replaceState({}, document.title, location.pathname);
  }
})();

(function () {
  const selectProduto  = document.getElementById('selectProdutoCadastro');
  const selectCategoria = document.getElementById('selectCategoria');
  const selectUnidade   = document.getElementById('selectUnidade');

  function applyDefaultsFromOption(opt) {
    if (!opt) return;
    const cat = opt.getAttribute('data-categoria') || '';
    const uni = opt.getAttribute('data-unidade') || '';
    if (cat && !selectCategoria.value) selectCategoria.value = cat;
    if (uni && !selectUnidade.value)   selectUnidade.value   = uni;
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
  const tel  = document.getElementById('telefoneFornecedor');

  if (cnpj) IMask(cnpj, { mask: '00.000.000/0000-00' });
  if (tel) IMask(tel, { 
    mask: [
      { mask: '(00) 0000-0000' },
      { mask: '(00) 00000-0000' }
    ]
  });
})();

window.__produtoFiltroAtivo = false;

(function(){
  const tbody   = document.querySelector('tbody');
  const $wrap   = document.getElementById('resumoProduto');
  const $nome   = document.getElementById('resumoNome');
  const $qtd    = document.getElementById('resumoQtd');
  const $unid   = document.getElementById('resumoUnid');
  const $valorW = document.getElementById('resumoValorWrap');
  const selProd = document.getElementById('f-prod');

  if(!$wrap) return;
  hide($wrap);

  const norm = (s) => (s||'').toString().trim().toLowerCase();

  function linhasDoProdutoSelecionado(){
    const alvo = norm(selProd?.value || '');
    if (!alvo) return [];
    const trs = Array.from(tbody?.querySelectorAll('tr') || []);
    return trs.filter(tr => tr.offsetParent !== null && norm(tr.dataset.produto) === alvo);
  }

  function recalcularResumo(){
    if (!window.__produtoFiltroAtivo || !selProd?.value){
      hide($wrap);
      return;
    }
    const linhas = linhasDoProdutoSelecionado();
    if (linhas.length === 0){
      hide($wrap);
      return;
    }

    let totalQtd = 0;
    for (const tr of linhas){
      const qtd = parseFloat(tr.dataset.quantidade||'0')||0;
      totalQtd += qtd;
    }

    $nome.textContent  = selProd.value || '';
    $qtd.textContent   = String(totalQtd);
    $unid.textContent  = (totalQtd === 1) ? 'unidade' : 'unidades';
    if ($valorW) hide($valorW);

    show($wrap);
  }
  document.addEventListener('estoque:recalcularResumo', recalcularResumo);
})();

window.__produtoFiltroAtivo = false;

(function(){
  const form   = document.querySelector('.filtros-form');
  const tbody  = document.querySelector('tbody');
  const selProd= document.getElementById('f-prod');
  const selCat = document.getElementById('f-cat');
  const selFor = document.getElementById('f-for');
  const selVal = document.getElementById('f-val');
  const busca  = document.getElementById('buscaProduto');

  if (!form || !tbody) return;

  const norm = (s) => (s||'').toString().trim().toLowerCase();

  const parseISODate = (s) => {
    if (!s) return null;
    const [y,m,d] = s.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m-1, d, 0, 0, 0, 0);
  };

  function diasAte(validade){
    if (!validade) return null;
    const hoje = new Date();
    const d0 = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const diffMs = parseISODate(validade.toISOString().split('T')[0]) - d0;
    return Math.ceil(diffMs / (1000*60*60*24));
  }

  function linhaPassa(tr){
    const dProd   = norm(tr.dataset.produto);
    const dCat    = norm(tr.dataset.categoria);
    const dFor    = norm(tr.dataset.fornecedor);
    const dValStr = tr.dataset.validade || '';
    const dtVal   = dValStr ? parseISODate(dValStr) : null;

    const alvoProd = norm(selProd?.value || '');
    if (alvoProd && dProd !== alvoProd) return false;

    const alvoCat = norm(selCat?.value || '');
    if (alvoCat && dCat !== alvoCat) return false;

    const alvoFor = norm(selFor?.value || '');
    if (alvoFor && dFor !== alvoFor) return false;

    const alvoVal = selVal?.value || '';
    if (alvoVal) {
      const hoje = new Date();
      const hojeZ = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      if (!dtVal) return false;
      const dias = diasAte(dtVal);
      if (alvoVal === 'vencido') {
        if (!(dtVal < hojeZ)) return false;
      } else if (alvoVal === 'proximo') {
        if (!(dias !== null && dias <= 7 && dias >= 0)) return false;
      }
    }

    const termo = norm(busca?.value || '');
    if (termo) {
      const textoLinha = [
        dProd,
        dCat,
        dFor,
        norm(tr.querySelector("td[data-label='Valor']")?.textContent || '')
      ].join(' ');
      if (!textoLinha.includes(termo)) return false;
    }

    return true;
  }

  function aplicarFiltros(){
    const linhas = tbody.querySelectorAll('tr');
    linhas.forEach(tr => {
      if (linhaPassa(tr)) {
        tr.classList.remove('row-hidden');
      } else {
        tr.classList.add('row-hidden');
      }
    });
    window.__produtoFiltroAtivo = !!(selProd && selProd.value);
    document.dispatchEvent(new Event('estoque:recalcularResumo'));
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    aplicarFiltros();
  });

})();

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const d = new Date(dataISO);
  return d.toLocaleDateString('pt-BR');
}

(function() {
    const rowsPerPage = 5; 
    const table = document.querySelector("table tbody");
    const paginationContainer = document.getElementById("pagination-container");
    if (!table) return;

    function getVisibleRows() {
      return Array.from(table.querySelectorAll("tr:not(.row-hidden)"));
    }
    let currentPage = 1;
    function showPage(page) {
      currentPage = page;
      const rows = getVisibleRows();
      const totalPages = Math.ceil(rows.length / rowsPerPage);
      rows.forEach(row => row.style.display = "none");
      const start = (page - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      rows.slice(start, end).forEach(row => row.style.display = "");
      renderPagination(totalPages);
    }
    function renderPagination(totalPages) {
      paginationContainer.innerHTML = "";
      if (totalPages <= 1) return;
      const pagination = document.createElement("div");
      pagination.className = "pagination";
      const prev = document.createElement("button");
      prev.innerText = "«";
      prev.disabled = currentPage === 1;
      prev.onclick = () => showPage(currentPage - 1);
      pagination.appendChild(prev);
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = i === currentPage ? "active" : "";
        btn.onclick = () => showPage(i);
        pagination.appendChild(btn);
      }
      const next = document.createElement("button");
      next.innerText = "»";
      next.disabled = currentPage === totalPages;
      next.onclick = () => showPage(currentPage + 1);
      pagination.appendChild(next);
      paginationContainer.appendChild(pagination);
    }
    showPage(1);
    document.querySelector('.filtros-form')?.addEventListener('submit', function(e){
      setTimeout(() => showPage(1));
    });
  })();

function abrirModalPorId(produtoId) {
  const tr = document.querySelector(`tr[data-id="${produtoId}"]`);
  if (tr) {
    const btnEditar = tr.querySelector('[data-role="editar"]');
    if (btnEditar) {
      abrirEditarEstoque(btnEditar);
      return true;
    }
  }
  return false;
}

window.abrirModalPorId = abrirModalPorId;

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const serverEditId = typeof window.editId !== 'undefined' ? window.editId : null;
  
  const produtoIdParaEditar = editId || serverEditId;
  
  if (produtoIdParaEditar) {
    setTimeout(() => {
      const sucesso = abrirModalPorId(produtoIdParaEditar);
      if (sucesso) {
        console.log('Modal de edição aberto via QR Code para produto ID:', produtoIdParaEditar);
        if (editId) {
          const novaUrl = window.location.pathname + (window.location.search.replace(/[?&]edit=[^&]*/, '').replace(/^\?&/, '?').replace(/^\?$/, ''));
          window.history.replaceState({}, '', novaUrl);
        }
      } else {
        console.warn('Não foi possível encontrar o produto com ID:', produtoIdParaEditar);
      }
    }, 100);
  }
});