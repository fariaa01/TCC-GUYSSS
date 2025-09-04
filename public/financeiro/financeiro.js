 document.addEventListener('DOMContentLoaded', function () {
    function hojeISO() {
      var d = new Date();
      return d.toISOString().slice(0, 10);
    }
    function addDias(iso, qtd) {
      var d = new Date(iso + 'T00:00:00');
      d.setDate(d.getDate() + qtd);
      return d.toISOString().slice(0, 10);
    }
    function primeiroDiaDoMes() {
      var d = new Date();
      d.setDate(1);
      return d.toISOString().slice(0, 10);
    }
    function ultimoDiaDoMes() {
      var d = new Date();
      d.setMonth(d.getMonth() + 1, 0);
      return d.toISOString().slice(0, 10);
    }
    function valorInput(el) { return el ? (el.value || '') : ''; }

    var modalLanc = document.getElementById('modalLancamento');
    var formLanc  = document.getElementById('formLancamento');
    var btnNL1    = document.getElementById('btnNovoLancamento');
    var btnNL2    = document.getElementById('btnNovoLancamento2');
    var btnNL3    = document.getElementById('btnEmptyAdd');
    var btnFechar = document.getElementById('fecharModal');
    var btnCanc   = document.getElementById('cancelarLancamento');

    function abrirLanc() {
      if (!modalLanc) return;
      modalLanc.classList.add('is-open');
      setTimeout(function () {
        if (!formLanc) return;
        var primeiro = formLanc.querySelector('select, input');
        if (primeiro) primeiro.focus();
      }, 0);
    }
    function fecharLanc() {
      if (modalLanc) modalLanc.classList.remove('is-open');
    }
    if (btnNL1) btnNL1.addEventListener('click', abrirLanc);
    if (btnNL2) btnNL2.addEventListener('click', abrirLanc);
    if (btnNL3) btnNL3.addEventListener('click', abrirLanc);
    if (btnFechar) btnFechar.addEventListener('click', fecharLanc);
    if (btnCanc) btnCanc.addEventListener('click', fecharLanc);
    window.addEventListener('click', function (e) {
      if (e.target === modalLanc) fecharLanc();
    });

    var inpBusca   = document.getElementById('busca');
    var selCat     = document.getElementById('filtroCategoria');
    var inpDataIni = document.getElementById('filtroDataInicio');
    var inpDataFim = document.getElementById('filtroDataFim');
    var tabela     = document.getElementById('tabela');
    var chips      = Array.prototype.slice.call(document.querySelectorAll('.chip'));
    var tipoAtivo  = 'todos';

    function dentroDoPeriodo(dataISO, iniISO, fimISO) {
      if (!dataISO) return true;
      if (iniISO && dataISO < iniISO) return false;
      if (fimISO && dataISO > fimISO) return false;
      return true;
    }

    function aplicarFiltros() {
      var q   = valorInput(inpBusca).toLowerCase().trim();
      var cat = valorInput(selCat);
      var ini = valorInput(inpDataIni);
      var fim = valorInput(inpDataFim);

      var visiveis = 0;
      var corpo = tabela ? tabela.querySelector('tbody') : null;
      var linhas = corpo ? corpo.querySelectorAll('tr') : [];

      for (var i = 0; i < linhas.length; i++) {
        var tr = linhas[i];
        if (tr.classList.contains('empty-row')) continue;

        var rowCat  = tr.getAttribute('data-categoria') || '';
        var rowTipo = tr.getAttribute('data-tipo') || '';
        var rowData = tr.getAttribute('data-data') || '';

        var texto = (rowCat + ' ' + rowTipo).toLowerCase();
        var okBusca = !q || texto.indexOf(q) > -1;
        var okCat   = !cat || rowCat === cat;
        var okTipo  = (tipoAtivo === 'todos') || rowTipo === tipoAtivo;
        var okData  = dentroDoPeriodo(rowData, ini, fim);

        var mostrar = okBusca && okCat && okTipo && okData;
        tr.style.display = mostrar ? '' : 'none';
        if (mostrar) visiveis++;
      }

      var emptyId = 'empty-after-filter';
      var existente = document.getElementById(emptyId);
      if (visiveis === 0) {
        if (!existente && corpo) {
          var nova = document.createElement('tr');
          nova.id = emptyId;
          nova.innerHTML = '<td colspan="5"><div class="empty small">' +
            '<i class="fa-regular fa-folder-open"></i>' +
            '<p>Nenhum resultado com os filtros aplicados.</p>' +
            '<button class="btn btn--ghost" id="btnLimpar2">Limpar filtros</button>' +
          '</div></td>';
          corpo.appendChild(nova);
          var btnLimpar2 = document.getElementById('btnLimpar2');
          if (btnLimpar2) {
            btnLimpar2.addEventListener('click', limparFiltros);
          }
        }
      } else {
        if (existente) existente.remove();
      }
    }

    function limparFiltros() {
      if (inpBusca) inpBusca.value = '';
      if (selCat) selCat.value = '';
      if (inpDataIni) inpDataIni.value = '';
      if (inpDataFim) inpDataFim.value = '';
      tipoAtivo = 'todos';
      for (var i = 0; i < chips.length; i++) {
        var c = chips[i];
        var tipo = c.getAttribute('data-tipo');
        if (tipo === 'todos') c.classList.add('is-active');
        else c.classList.remove('is-active');
      }
      aplicarFiltros();
    }

    if (inpBusca)   inpBusca.addEventListener('input', aplicarFiltros);
    if (selCat)     selCat.addEventListener('change', aplicarFiltros);
    if (inpDataIni) inpDataIni.addEventListener('change', aplicarFiltros);
    if (inpDataFim) inpDataFim.addEventListener('change', aplicarFiltros);

    for (var i = 0; i < chips.length; i++) {
      (function (chip) {
        chip.addEventListener('click', function () {
          for (var j = 0; j < chips.length; j++) chips[j].classList.remove('is-active');
          chip.classList.add('is-active');
          tipoAtivo = chip.getAttribute('data-tipo') || 'todos';
          aplicarFiltros();
        });
      })(chips[i]);
    }

    var btnHoje   = document.getElementById('btnHoje');
    var btn7d     = document.getElementById('btn7d');
    var btn30d    = document.getElementById('btn30d');
    var btnMes    = document.getElementById('btnMes');
    var btnLimpar = document.getElementById('btnLimparFiltros');

    function setRange(startISO, endISO) {
      if (inpDataIni) inpDataIni.value = startISO;
      if (inpDataFim) inpDataFim.value = endISO;
      aplicarFiltros();
    }

    if (btnHoje)   btnHoje.addEventListener('click', function(){ setRange(hojeISO(), hojeISO()); });
    if (btn7d)     btn7d.addEventListener('click', function(){ setRange(addDias(hojeISO(), -6), hojeISO()); });
    if (btn30d)    btn30d.addEventListener('click', function(){ setRange(addDias(hojeISO(), -29), hojeISO()); });
    if (btnMes)    btnMes.addEventListener('click', function(){ setRange(primeiroDiaDoMes(), ultimoDiaDoMes()); });
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);

    var modalFixo = document.getElementById('modalGastoFixo');
    var formFixo  = document.getElementById('formGastoFixo');
    var btnNF1    = document.getElementById('btnNovoGastoFixo');
    var btnNF2    = document.getElementById('btnEmptyAddFixo');
    var btnFFecha = document.getElementById('fecharModalFixo');
    var btnFCan   = document.getElementById('cancelarGastoFixo');

    function abrirFixo() {
      if (!modalFixo) return;
      modalFixo.classList.add('is-open');
      setTimeout(function(){
        if (!formFixo) return;
        var primeiro = formFixo.querySelector('input, select');
        if (primeiro) primeiro.focus();
      }, 0);
    }
    function fecharFixo() {
      if (modalFixo) modalFixo.classList.remove('is-open');
    }
    if (btnNF1) btnNF1.addEventListener('click', abrirFixo);
    if (btnNF2) btnNF2.addEventListener('click', abrirFixo);
    if (btnFFecha) btnFFecha.addEventListener('click', fecharFixo);
    if (btnFCan) btnFCan.addEventListener('click', fecharFixo);
    window.addEventListener('click', function (e) {
      if (e.target === modalFixo) fecharFixo();
    });

    var inpBuscaFixos = document.getElementById('buscaFixos');
    if (inpBuscaFixos) {
      inpBuscaFixos.addEventListener('input', function () {
        var q = (inpBuscaFixos.value || '').toLowerCase().trim();
        var corpo = document.querySelector('#tabelaFixos tbody');
        if (!corpo) return;
        var linhas = corpo.querySelectorAll('tr');
        for (var i = 0; i < linhas.length; i++) {
          var row = linhas[i];
          if (row.classList.contains('empty-row')) continue;
          var cols = row.querySelectorAll('[data-col="nome"], [data-col="recorrencia"]');
          var txt = '';
          for (var c = 0; c < cols.length; c++) {
            txt += ' ' + (cols[c].textContent || '').toLowerCase();
          }
          row.style.display = txt.indexOf(q) > -1 ? '' : 'none';
        }
      });
    }
  });

  window.confirmarExclusaoLancamento = function (id) {
    if (typeof Swal === 'undefined') return;
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Deseja excluir este lançamento?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      customClass: { confirmButton: 'btn btn--danger', cancelButton: 'btn btn--ghost' }
    }).then(function (res) {
      if (!res.isConfirmed) return;
      var f = document.createElement('form');
      f.method = 'POST';
      f.action = '/financeiro/delete/' + id;
      document.body.appendChild(f);
      f.submit();
    });
  };

  window.confirmarExclusaoGastoFixo = function (id) {
    if (typeof Swal === 'undefined') return;
    Swal.fire({
      title: 'Excluir gasto fixo?',
      text: 'Essa ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      customClass: { confirmButton: 'btn btn--danger', cancelButton: 'btn btn--ghost' }
    }).then(function (res) {
      if (!res.isConfirmed) return;
      fetch('/gastos-fixos/' + id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          location.reload();
        })
        .catch(function () {
          Swal.fire('Erro', 'Não foi possível excluir o gasto fixo.', 'error');
        });
    });
  };

