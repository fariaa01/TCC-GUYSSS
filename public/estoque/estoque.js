  function show(el)  { if (el) el.classList.remove('is-hidden'); }
  function hide(el)  { if (el) el.classList.add('is-hidden'); }
  function openModal(el)  { if (el) el.classList.add('is-open'); }
  function closeModal(el) { if (el) el.classList.remove('is-open'); }

  function bindModal(openBtnId, modalId, closeBtnId, cancelBtnId) {
    const modal = document.getElementById(modalId);
    const btnOpen = document.getElementById(openBtnId);
    const btnClose = document.getElementById(closeBtnId);
    const btnCancel = document.getElementById(cancelBtnId);

    if (btnOpen)   btnOpen.addEventListener('click', () => openModal(modal));
    if (btnClose)  btnClose.addEventListener('click', () => closeModal(modal));
    if (btnCancel) btnCancel.addEventListener('click', () => closeModal(modal));
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
  }

  bindModal("btnNovoProduto", "modalProduto", "fecharModal", "cancelarModalProduto");
  bindModal("btnCadastrarProduto", "modalCadastroProduto", "fecharModalCadastro", "cancelarModalCadastroProduto");
  bindModal("btnCadastrarFornecedor", "modalCadastroFornecedor", "fecharModalFornecedor", "cancelarModalFornecedor");

  const modalEditar = document.getElementById("modalEditarEstoque");
  const btnFecharEditar = document.getElementById("fecharModalEditar");
  const btnCancelEditar = document.getElementById("cancelarModalEditar");
  if (btnFecharEditar) btnFecharEditar.addEventListener("click", () => closeModal(modalEditar));
  if (btnCancelEditar) btnCancelEditar.addEventListener("click", () => closeModal(modalEditar));
  window.addEventListener("click", (e) => { if (e.target === modalEditar) closeModal(modalEditar); });

  const selectEditProduto   = document.getElementById('edit_produto');
  const selectEditCategoria = document.getElementById('edit_categoria');
  const selectEditUnidade   = document.getElementById('edit_unidade_medida');

  function syncProdutoToFields(force=false) {
    if (!selectEditProduto) return;
    const opt = selectEditProduto.options[selectEditProduto.selectedIndex];
    if (!opt) return;
    if (force || !selectEditCategoria.value) selectEditCategoria.value = opt.dataset.categoria || '';
    if (force || !selectEditUnidade.value)   selectEditUnidade.value   = opt.dataset.unidade   || '';
  }

  function selectOptionOrCreate(selectEl, value) {
    if (!selectEl || !value) return;
    selectEl.value = value;
    if (selectEl.value !== value) {
      const opt = new Option(value, value, true, true);
      selectEl.add(opt);
    }
  }

  if (selectEditProduto && !selectEditProduto.__hasChangeListener) {
    selectEditProduto.addEventListener('change', () => syncProdutoToFields(false));
    selectEditProduto.__hasChangeListener = true;
  }

  document.addEventListener('click', (e) => {
    const btnEditar = e.target.closest('[data-role="editar"]');
    if (btnEditar) { e.preventDefault(); abrirEditarEstoque(btnEditar); return; }
    const btnExcluir = e.target.closest('[data-role="excluir"]');
    if (btnExcluir) { e.preventDefault(); confirmarExclusao(btnExcluir.dataset.id); return; }
  });

  function abrirEditarEstoque(btn) {
    const tr = btn?.closest('tr');
    if (!tr || !modalEditar) return;

    const id = tr.dataset.id || '';
    document.getElementById('edit_id')?.setAttribute('value', id);

    selectOptionOrCreate(selectEditProduto, tr.dataset.produto || '');
    selectEditCategoria.value = tr.dataset.categoria || '';
    selectEditUnidade.value   = tr.dataset.unidade_medida || '';

    const setVal = (idEl, val) => { const el = document.getElementById(idEl); if (el) el.value = val; };
    setVal('edit_quantidade',        tr.dataset.quantidade);
    setVal('edit_quantidade_minima', tr.dataset.quantidade_minima);
    setVal('edit_valor',             tr.dataset.valor);
    setVal('edit_validade',          tr.dataset.validade);
    setVal('edit_fornecedor',        tr.dataset.fornecedor);

    syncProdutoToFields(false);

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
        confirmButton: 'btn btn-excluir',
        cancelButton: 'btn btn-voltar'
      }
    }).then((res) => {
      if (res.isConfirmed) location.href = `/estoque/delete/${id}`;
    });
  }
  window.confirmarExclusao = confirmarExclusao;

  (function () {
    const params = new URLSearchParams(location.search);
    const ok = params.get('ok');
    const msg = params.get('msg');
    if (msg) {
      Swal.fire({
        icon: ok === '1' ? 'success' : 'error',
        title: ok === '1' ? 'Tudo certo!' : 'Ops...',
        text: msg,
        buttonsStyling: false,
        customClass:{ confirmButton:'btn btn-voltar' }
      });
      history.replaceState({}, document.title, location.pathname);
    }
  })();

  (function () {
    const selProd = document.getElementById('selectProdutoCadastro');
    const selCat  = document.getElementById('selectCategoria');
    const selUni  = document.getElementById('selectUnidade');

    function aplicarDefaults(opt) {
      if (!opt) return;
      if (opt.dataset.categoria && !selCat.value) selCat.value = opt.dataset.categoria;
      if (opt.dataset.unidade && !selUni.value)   selUni.value = opt.dataset.unidade;
    }

    selProd?.addEventListener('change', () => aplicarDefaults(selProd.selectedOptions[0]));
    if (selProd && selProd.value) aplicarDefaults(selProd.selectedOptions[0]);
  })();

  (function () {
    const cnpj = document.getElementById('cnpjFornecedor');
    const tel  = document.getElementById('telefoneFornecedor');
    if (cnpj) IMask(cnpj, { mask: '00.000.000/0000-00' });
    if (tel) IMask(tel, { mask: [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }] });
  })();

  (function(){
    const tbody = document.querySelector('tbody');
    const wrap  = document.getElementById('resumoProduto');
    const nome  = document.getElementById('resumoNome');
    const qtd   = document.getElementById('resumoQtd');
    const unid  = document.getElementById('resumoUnid');
    const valor = document.getElementById('resumoValorWrap');
    const sel   = document.getElementById('f-prod');

    if (!wrap) return;
    hide(wrap);

    function linhasSelecionadas(){
      const alvo = (sel?.value||'').trim().toLowerCase();
      if (!alvo) return [];
      return Array.from(tbody?.querySelectorAll('tr')||[])
        .filter(tr => tr.offsetParent !== null && (tr.dataset.produto||'').toLowerCase() === alvo);
    }

    function recalcular(){
      if (!window.__produtoFiltroAtivo || !sel?.value){ hide(wrap); return; }
      const linhas = linhasSelecionadas();
      if (!linhas.length){ hide(wrap); return; }
      let totalQtd = 0;
      linhas.forEach(tr => totalQtd += parseFloat(tr.dataset.quantidade||'0')||0);
      nome.textContent = sel.value;
      qtd.textContent  = totalQtd;
      unid.textContent = (totalQtd===1) ? 'unidade' : 'unidades';
      if (valor) hide(valor);
      show(wrap);
    }
    document.addEventListener('estoque:recalcularResumo', recalcular);
  })();

  (function(){
    const form  = document.querySelector('.filtros-form');
    const tbody = document.querySelector('tbody');
    const selProd= document.getElementById('f-prod');
    const selCat = document.getElementById('f-cat');
    const selFor = document.getElementById('f-for');
    const selVal = document.getElementById('f-val');
    const busca  = document.getElementById('buscaProduto');

    if (!form || !tbody) return;

    function parseISODate(s){
      if (!s) return null;
      const [y,m,d]=s.split('-').map(Number);
      return y&&m&&d ? new Date(y,m-1,d) : null;
    }

    function linhaOk(tr){
      const termo = (busca?.value||'').toLowerCase().trim();
      const dProd= (tr.dataset.produto||'').toLowerCase();
      const dCat = (tr.dataset.categoria||'').toLowerCase();
      const dFor = (tr.dataset.fornecedor||'').toLowerCase();
      const dVal = parseISODate(tr.dataset.validade);

      if (selProd?.value && dProd!==selProd.value.toLowerCase()) return false;
      if (selCat?.value && dCat!==selCat.value.toLowerCase()) return false;
      if (selFor?.value && dFor!==selFor.value.toLowerCase()) return false;
      if (selVal?.value){
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        if (!dVal) return false;
        const dias=(dVal-hoje)/(1000*60*60*24);
        if (selVal.value==='vencido' && !(dVal<hoje)) return false;
        if (selVal.value==='proximo' && !(dias>=0 && dias<=7)) return false;
      }
      if (termo){
        const texto = [dProd,dCat,dFor,(tr.querySelector("td[data-label='Valor']")?.textContent||'').toLowerCase()].join(' ');
        if (!texto.includes(termo)) return false;
      }
      return true;
    }

    function aplicarFiltros(){
      tbody.querySelectorAll('tr').forEach(tr => {
        tr.classList.toggle('row-hidden', !linhaOk(tr));
      });
      window.__produtoFiltroAtivo = !!(selProd && selProd.value);
      document.dispatchEvent(new Event('estoque:recalcularResumo'));
    }

    form.addEventListener('submit', e => { e.preventDefault(); aplicarFiltros(); });
  })();
