(function(){
  const tbody = document.querySelector('tbody');
  if (!tbody) return;

  const fieldMap = {
    'Quantidade':        { key: 'quantidade',        step: '1', min: 0, integerIfUn: true },
    'Qtd. Mínima':       { key: 'quantidade_minima', step: '1', min: 0, integerIfUn: true },
    'Valor':             { key: 'valor',             step: '0.01', min: 0, isMoney: true }
  };

  tbody.querySelectorAll('td[data-label="Quantidade"], td[data-label="Qtd. Mínima"], td[data-label="Valor"]').forEach(td => {
    td.title = 'Duplo clique para editar • Enter salva • Esc cancela';
    td.style.cursor = 'pointer';
  });

  let editing = null;

  function getCsrf() {
    const m = document.querySelector('meta[name="csrf-token"]');
    return m?.getAttribute('content') || '';
  }

  function createInput(initial, cfg){
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'decimal';
    input.step = cfg.step;
    input.min = String(cfg.min);
    input.value = initial;
    input.style.width = '100%';
    input.style.boxSizing = 'border-box';
    input.autofocus = true;
    return input;
  }

  function formatMoney(n){
    const num = Number(n || 0);
    return `R$ ${num.toFixed(2)}`;
  }

  function showInCell(td, cfg, value){
    if (cfg.isMoney) td.textContent = formatMoney(value);
    else td.textContent = String(value);
    td.classList.remove('editing');
    td.classList.remove('saving');
  }

  function parseFromCell(td, cfg, tr){
    if (cfg.isMoney) return tr.dataset[cfg.key] ?? '0';
    return (td.textContent || '').replace(/[^\d.,-]/g,'').replace(',','.') || '0';
  }

  function clampValue(cfg, tr, rawVal){
    let v = parseFloat(rawVal);
    if (isNaN(v)) v = 0;
    if (v < cfg.min) v = cfg.min;
    const un = (tr.dataset.unidade_medida || '').toLowerCase();
    if (cfg.integerIfUn && (un === 'un' || un === 'unidade' || un === 'unidades')) {
      v = Math.round(v);
    }
    return cfg.isMoney ? Number(v.toFixed(2)) : Number(v);
  }

  async function saveInline(tr, td, cfg, newValNum, oldValNum){
    if (newValNum === oldValNum) { showInCell(td, cfg, oldValNum); return; }

    const id   = tr.dataset.id;
    const body = new URLSearchParams({
      produto:            tr.dataset.produto || '',
      categoria:          tr.dataset.categoria || '',
      quantidade:         cfg.key === 'quantidade'         ? String(newValNum) : tr.dataset.quantidade || '0',
      quantidade_minima:  cfg.key === 'quantidade_minima'  ? String(newValNum) : tr.dataset.quantidade_minima || '0',
      unidade_medida:     tr.dataset.unidade_medida || '',
      valor:              cfg.key === 'valor'              ? String(newValNum) : tr.dataset.valor || '0',
      validade:           tr.dataset.validade || '',
      fornecedor:         tr.dataset.fornecedor || ''
    });

    editing = null;
    td.classList.remove('editing');
    td.classList.add('saving');
    td.textContent = 'Salvando...';

    const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' };
    const csrf = getCsrf();
    if (csrf) headers['X-CSRF-Token'] = csrf;

    try {
      const res = await fetch(`/estoque/${id}/update`, { method: 'POST', headers, body });
      let ok = res.ok, payload = null;
      try { payload = await res.json(); ok = payload?.ok ?? res.ok; } catch { /* ignora */ }
      if (!ok) throw new Error(payload?.message || `HTTP ${res.status}`);

      tr.dataset[cfg.key] = String(newValNum);
      showInCell(td, cfg, newValNum);
      document.dispatchEvent(new Event('estoque:recalcularResumo'));
    } catch (err) {
      console.error('Salvar inline falhou:', err);
      showInCell(td, cfg, oldValNum);
    } finally {
      td.classList.remove('saving');
    }
  }

  function beginEdit(td, tr, cfg){
    if (editing) return;
    if (td.classList.contains('saving') || td.classList.contains('editing')) return;

    const oldRaw = parseFromCell(td, cfg, tr);
    const oldNum = clampValue(cfg, tr, oldRaw);

    const input = createInput(String(oldNum), cfg);
    editing = { td, tr, cfg, oldNum };

    td.classList.add('editing');
    td.dataset.label = td.getAttribute('data-label') || '';
    td.textContent = '';
    td.appendChild(input);
    input.focus(); input.select();

    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const newNum = clampValue(cfg, tr, input.value.trim());
        saveInline(tr, td, cfg, newNum, oldNum);
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        editing = null;
        showInCell(td, cfg, oldNum);
      }
    });

    input.addEventListener('blur', () => {
      if (!td.classList.contains('editing')) return;
      const newNum = clampValue(cfg, tr, input.value.trim());
      saveInline(tr, td, cfg, newNum, oldNum);
    });
  }

  tbody.addEventListener('dblclick', (e) => {
    const td = e.target.closest('td');
    const tr = e.target.closest('tr');
    if (!td || !tr) return;

    const label = td.getAttribute('data-label');
    const cfg = fieldMap[label];
    if (!cfg) return;

    beginEdit(td, tr, cfg);
  });
})();

(function () {
      const modalEditar = document.getElementById('modalEditarEstoque');
      const selectEditProduto = document.getElementById('edit_produto');
      const selectEditCategoria = document.getElementById('edit_categoria');
      const selectEditUnidade  = document.getElementById('edit_unidade_medida');

      function syncProdutoToFields() {
        const opt = selectEditProduto.options[selectEditProduto.selectedIndex];
        if (!opt) return;
        if (!selectEditCategoria.value) selectEditCategoria.value = opt.dataset.categoria || '';
        if (!selectEditUnidade.value)  selectEditUnidade.value  = opt.dataset.unidade   || '';
      }

      selectEditProduto?.addEventListener('change', syncProdutoToFields);

      document.querySelectorAll('button.btn-editar[data-role="editar"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tr = e.currentTarget.closest('tr');
          if (!tr) return;

          document.getElementById('edit_id').value = tr.dataset.id || '';
          const produtoAtual = tr.dataset.produto || '';
          
          selectEditProduto.value = produtoAtual;
          if (selectEditProduto.value !== produtoAtual && produtoAtual) {
            const opt = new Option(produtoAtual, produtoAtual, true, true);
            selectEditProduto.add(opt);
          }

          document.getElementById('edit_quantidade').value        = tr.dataset.quantidade || '';
          document.getElementById('edit_quantidade_minima').value = tr.dataset.quantidade_minima || '';
          document.getElementById('edit_valor').value             = tr.dataset.valor || '';
          document.getElementById('edit_validade').value          = tr.dataset.validade || '';
          document.getElementById('edit_fornecedor').value        = tr.dataset.fornecedor || '';

          selectEditCategoria.value = tr.dataset.categoria || '';
          selectEditUnidade.value   = tr.dataset.unidade_medida || '';
          if (!selectEditCategoria.value || !selectEditUnidade.value) {
            syncProdutoToFields();
          }

          modalEditar.style.display = 'block';
        });
      });

      document.getElementById('fecharModalEditar')?.addEventListener('click', () => {
        modalEditar.style.display = 'none';
      });
      document.getElementById('cancelarModalEditar')?.addEventListener('click', () => {
        modalEditar.style.display = 'none';
      });
      window.addEventListener('click', (e) => {
        if (e.target === modalEditar) modalEditar.style.display = 'none';
      });
    })();