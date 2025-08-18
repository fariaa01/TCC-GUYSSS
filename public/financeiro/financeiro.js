(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ------------- Util -------------
  function normaliza(txt) {
    return (txt || '')
      .toString()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstInput = modal.querySelector('input,select,textarea,button');
    if (firstInput) setTimeout(() => firstInput.focus(), 10);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    const form = modal.querySelector('form');
    if (form && modal.id !== 'modal-pagar') form.reset();
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal-target]');
    if (trigger) {
      const sel = trigger.getAttribute('data-modal-target');
      const modal = document.querySelector(sel);
      const monthInput = modal?.querySelector('input[type="month"][name="competencia"]');
      const start = $('#start')?.value || new Date().toISOString().slice(0,10);
      if (monthInput) monthInput.value = (start || '').slice(0,7);
      openModal(modal);
    }
    if (e.target.matches('.modal')) closeModal(e.target);
    if (e.target.hasAttribute('data-modal-close')) {
      const modal = e.target.closest('.modal');
      closeModal(modal);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.modal.show').forEach(closeModal);
  });

  const busca = $('#busca');
  const tabAtual =
    (new URLSearchParams(location.search).get('tab')) ||
    (document.querySelector('.tabs a.active')?.textContent?.trim().toLowerCase() || 'pagar');

  const tabelaAtual = {
    pagar:       $('#tabela-pagar'),
    receber:     $('#tabela-receber'),
    lançamentos: $('#tabela-lancamentos'),
    lancamentos: $('#tabela-lancamentos'),
  }[tabAtual] || $('#tabela-pagar');

  function filtrarTabela(q) {
    if (!tabelaAtual) return;
    const n = normaliza(q);
    $$('#' + tabelaAtual.id + ' tbody tr').forEach(tr => {
      const texto = normaliza(tr.innerText);
      tr.style.display = texto.includes(n) ? '' : 'none';
    });
  }
  if (busca) busca.addEventListener('input', (e) => filtrarTabela(e.target.value));

  const modalPagar = $('#modal-pagar');
  const formPagar = $('#form-pagar');
  const inputForma = $('#forma_pagamento');
  const inputData  = $('#data_pagamento');

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="abrir-modal-pagar"]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const forma = btn.getAttribute('data-forma') || '';
    if (formPagar) {
      formPagar.action = `/contas-a-pagar/${id}/pagar`;
      inputForma.value = forma;
      if (!inputData.value) inputData.value = new Date().toISOString().slice(0,10);
    }
    openModal(modalPagar);
  });

  function tabelaParaCSV(table) {
    const linhas = [];
    const linha = (row) => Array.from(row.querySelectorAll('th,td')).map(c => {
      const txt = (c.innerText || '').replace(/\s+/g, ' ').trim();
      return '"' + txt.replace(/"/g, '""') + '"';
    }).join(',');
    if (table.tHead?.rows?.[0]) linhas.push(linha(table.tHead.rows[0]));
    Array.from(table.tBodies[0].rows).forEach(r => {
      if (r.style.display === 'none') return;
      linhas.push(linha(r));
    });
    return linhas.join('\n');
  }
  function baixar(nome, conteudo, mime = 'text/csv;charset=utf-8;') {
    const blob = new Blob([conteudo], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nome; document.body.appendChild(a); a.click();
    URL.revokeObjectURL(url); a.remove();
  }
  $('#btn-exportar')?.addEventListener('click', () => {
    const t = tabelaAtual; if (!t) return;
    const nome = `financeiro_${tabAtual}_${new Date().toISOString().slice(0,10)}.csv`;
    const csv = tabelaParaCSV(t);
    baixar(nome, csv);
  });

  $('#btn-imprimir')?.addEventListener('click', () => window.print());
  const hiddenTab = document.querySelector('input[name="tab"]');
  const anchorAtivo = document.querySelector('.tabs a.active');
  if (hiddenTab && anchorAtivo) {
    const url = new URL(anchorAtivo.href);
    hiddenTab.value = url.searchParams.get('tab') || 'pagar';
  }
})();
