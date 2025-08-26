   (function () {
      const $  = (s, el=document) => el.querySelector(s);
      const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

      // ===== Modais: Lançamento
      const modal     = $('#modalLancamento');
      const formLanc  = $('#formLancamento');
      const btnOpen1  = $('#btnNovoLancamento');
      const btnOpen2  = $('#btnNovoLancamento2');
      const btnOpen3  = $('#btnEmptyAdd');
      const btnClose  = $('#fecharModal');
      const btnCancel = $('#cancelarLancamento');

      const openLanc  = () => { modal.classList.add('is-open'); setTimeout(()=>formLanc?.querySelector('select, input')?.focus(),0); };
      const closeLanc = () => modal.classList.remove('is-open');

      btnOpen1?.addEventListener('click', openLanc);
      btnOpen2?.addEventListener('click', openLanc);
      btnOpen3?.addEventListener('click', openLanc);
      btnClose?.addEventListener('click', closeLanc);
      btnCancel?.addEventListener('click', closeLanc);
      window.addEventListener('click', (e)=>{ if(e.target===modal) closeLanc(); });

      // ===== Modais: Gasto Fixo
      const modalF     = $('#modalGastoFixo');
      const formF      = $('#formGastoFixo');
      const btnOpenF1  = $('#btnNovoGastoFixo');
      const btnOpenF2  = $('#btnEmptyAddFixo');
      const btnCloseF  = $('#fecharModalFixo');
      const btnCancelF = $('#cancelarGastoFixo');

      const openFixo  = () => { modalF.classList.add('is-open'); setTimeout(()=>formF?.querySelector('input, select')?.focus(),0); };
      const closeFixo = () => modalF.classList.remove('is-open');

      btnOpenF1?.addEventListener('click', openFixo);
      btnOpenF2?.addEventListener('click', openFixo);
      btnCloseF?.addEventListener('click', closeFixo);
      btnCancelF?.addEventListener('click', closeFixo);
      window.addEventListener('click', (e)=>{ if(e.target===modalF) closeFixo(); });

      // ===== Filtros: Lançamentos
      const busca = $('#busca');
      const filtroCategoria = $('#filtroCategoria');
      const dIni = $('#filtroDataInicio');
      const dFim = $('#filtroDataFim');
      const chips = $$('.chip');
      const table = $('#tabela');
      const tbody = table?.querySelector('tbody');

      let tipoAtivo = 'todos';

      const toISO = (v) => v ? new Date(v+'T00:00:00').toISOString().slice(0,10) : '';
      const inRange = (dateISO, iniISO, fimISO) => {
        if (!dateISO) return true;
        if (iniISO && dateISO < iniISO) return false;
        if (fimISO && dateISO > fimISO) return false;
        return true;
      };

      const applyFilters = () => {
        const q = (busca?.value || '').toLowerCase().trim();
        const cat = filtroCategoria?.value || '';
        const ini = toISO(dIni?.value);
        const fim = toISO(dFim?.value);

        let visibles = 0;
        $$('#tabela tbody tr').forEach(tr => {
          if (tr.classList.contains('empty-row')) return;
          const rowCat = tr.getAttribute('data-categoria') || '';
          const rowTipo = tr.getAttribute('data-tipo') || '';
          const rowDate = tr.getAttribute('data-data') || '';

          const text = (rowCat + ' ' + rowTipo).toLowerCase();
          const matchBusca = !q || text.includes(q);
          const matchCat = !cat || rowCat === cat;
          const matchTipo = (tipoAtivo === 'todos') || rowTipo === tipoAtivo;
          const matchRange = inRange(rowDate, ini, fim);

          const show = matchBusca && matchCat && matchTipo && matchRange;
          tr.style.display = show ? '' : 'none';
          if (show) visibles++;
        });

        const emptyId = 'empty-after-filter';
        let emptyRow = document.getElementById(emptyId);
        if (!visibles) {
          if (!emptyRow) {
            emptyRow = document.createElement('tr');
            emptyRow.id = emptyId;
            emptyRow.innerHTML = `
              <td colspan="5">
                <div class="empty small">
                  <i class="fa-regular fa-folder-open"></i>
                  <p>Nenhum resultado com os filtros aplicados.</p>
                  <button class="btn btn--ghost" id="btnLimpar2">Limpar filtros</button>
                </div>
              </td>`;
            tbody?.appendChild(emptyRow);
            document.getElementById('btnLimpar2')?.addEventListener('click', clearFilters);
          }
        } else {
          emptyRow?.remove();
        }
      };

      const debounce = (fn, ms=250) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

      const clearFilters = () => {
        if (busca) busca.value = '';
        if (filtroCategoria) filtroCategoria.value = '';
        if (dIni) dIni.value = '';
        if (dFim) dFim.value = '';
        tipoAtivo = 'todos';
        chips.forEach(c => c.classList.toggle('is-active', c.dataset.tipo === 'todos'));
        applyFilters();
      };

      busca?.addEventListener('input', debounce(applyFilters, 200));
      filtroCategoria?.addEventListener('change', applyFilters);
      dIni?.addEventListener('change', applyFilters);
      dFim?.addEventListener('change', applyFilters);

      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');
          tipoAtivo = chip.dataset.tipo;
          applyFilters();
        });
      });

      const setRange = (start, end) => { if (dIni) dIni.value = start; if (dFim) dFim.value = end; applyFilters(); };
      const todayISO = new Date().toISOString().slice(0,10);
      const addDays = (d, diff) => { const dt=new Date(d); dt.setDate(dt.getDate()+diff); return dt.toISOString().slice(0,10); };
      const firstDayMonth = (() => { const dt=new Date(); dt.setDate(1); return dt.toISOString().slice(0,10); })();
      const lastDayMonth  = (() => { const dt=new Date(); dt.setMonth(dt.getMonth()+1,0); return dt.toISOString().slice(0,10); })();

      document.getElementById('btnHoje')?.addEventListener('click', () => setRange(todayISO, todayISO));
      document.getElementById('btn7d')?.addEventListener('click', () => setRange(addDays(todayISO,-6), todayISO));
      document.getElementById('btn30d')?.addEventListener('click', () => setRange(addDays(todayISO,-29), todayISO));
      document.getElementById('btnMes')?.addEventListener('click', () => setRange(firstDayMonth, lastDayMonth));
      document.getElementById('btnLimparFiltros')?.addEventListener('click', clearFilters);

      // ===== Busca fixos
      const buscaFixos = $('#buscaFixos');
      buscaFixos?.addEventListener('input', debounce(() => {
        const q = buscaFixos.value.toLowerCase().trim();
        $$('#tabelaFixos tbody tr').forEach(row => {
          if (row.classList.contains('empty-row')) return;
          const texto = Array.from(row.querySelectorAll('[data-col="nome"], [data-col="recorrencia"]'))
            .map(td => td.textContent.toLowerCase())
            .join(' ');
          row.style.display = texto.includes(q) ? '' : 'none';
        });
      }, 200));
    })();

    // ===== SweetAlert (botões seguindo seu modelo de CSS)
    function confirmarExclusaoLancamento(id) {
      Swal.fire({
        title: 'Tem certeza?',
        text: 'Deseja excluir este lançamento?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn--danger',
          cancelButton: 'btn btn--ghost'
        }
      }).then((result) => {
        if (!result.isConfirmed) return;
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/financeiro/delete/${id}`;
        document.body.appendChild(form);
        form.submit();
      });
    }

    function confirmarExclusaoGastoFixo(id) {
      Swal.fire({
        title: 'Excluir gasto fixo?',
        text: 'Essa ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn--danger',
          cancelButton: 'btn btn--ghost'
        }
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        try {
          const resp = await fetch(`/gastos-fixos/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
          if (!resp.ok) throw new Error('Falha ao excluir');
          location.reload();
        } catch (e) {
          Swal.fire('Erro', 'Não foi possível excluir o gasto fixo.', 'error');
        }
      });
    }