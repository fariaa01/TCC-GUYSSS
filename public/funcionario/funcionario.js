const modal = document.getElementById("modalFuncionario");
  const modalEditar = document.getElementById("modalEditarFuncionario");
  const btnAbrir = document.getElementById("btnNovoFuncionario");
  const btnFechar = document.getElementById("fecharModal");
  const btnFecharEditar = modalEditar.querySelector(".close");

  btnAbrir.addEventListener("click", () => modal.style.display = "flex");
  btnFechar.addEventListener("click", () => modal.style.display = "none");
  btnFecharEditar.addEventListener("click", () => modalEditar.style.display = "none");
  
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
    if (e.target === modalEditar) modalEditar.style.display = "none";

    const modalHistoricoSalarial = document.getElementById('modalHistoricoSalarial');
    const modalNovoReajuste = document.getElementById('modalNovoReajuste');
    
    if (modalHistoricoSalarial && e.target === modalHistoricoSalarial) {
      modalHistoricoSalarial.classList.remove('show');
    }
    if (modalNovoReajuste && e.target === modalNovoReajuste) {
      modalNovoReajuste.style.display = "none";
    }
  });

  function confirmarExclusao(id) {
    Swal.fire({
      title: 'Tem certeza?',
      text: "Deseja realmente excluir este funcionário?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = `/funcionarios/delete/${id}`;
      }
    });
  }

  function abrirModalEdicao(btn) {
    const dados = btn.dataset;
    
    document.getElementById('editarId').value = dados.id;
    document.getElementById('editarNome').value = dados.nome;
    document.getElementById('editarCargo').value = dados.cargo;
    document.getElementById('editarEmail').value = dados.email;
    document.getElementById('editarSalario').value = dados.salario;
    document.getElementById('editarCpf').value = dados.cpf;
    document.getElementById('editarTelefone').value = dados.telefone;
    document.getElementById('editarEstado').value = dados.estado;
    
    if (dados.data_admissao) {
      const data = new Date(dados.data_admissao);
      const dataFormatada = data.toISOString().split('T')[0];
      document.getElementById('editarDataAdmissao').value = dataFormatada;
    }
    
    const form = modalEditar.querySelector('form');
    form.action = `/funcionarios/${dados.id}/update`;
    
    modalEditar.style.display = "flex";
  }

  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-editar')) {
      e.preventDefault();
      const btn = e.target.closest('.btn-editar');
      abrirModalEdicao(btn);
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const ok = urlParams.get('ok');
  const msg = urlParams.get('msg');
  
  if (ok === '1' && msg) {
    Swal.fire({ 
      icon: 'success', 
      title: 'Tudo certo!', 
      text: msg, 
      buttonsStyling: false, 
      customClass: { confirmButton: 'btn btn-voltar' } 
    });
    history.replaceState({}, document.title, location.pathname);
  } else if (ok === '0' && msg) {
    Swal.fire({ 
      icon: 'error', 
      title: 'Ops...', 
      text: msg, 
      buttonsStyling: false, 
      customClass: { confirmButton: 'btn btn-voltar' } 
    });
    history.replaceState({}, document.title, location.pathname);
  }

  if (urlParams.get('success') === '1') {
    Swal.fire({
      icon: 'success',
      title: 'Tudo certo!',
      text: 'Funcionário cadastrado com sucesso!',
      buttonsStyling: false,
      customClass: { confirmButton: 'btn btn-voltar' }
    });
    history.replaceState({}, document.title, location.pathname);
  }

  if (urlParams.get('updated') === '1') {
    Swal.fire({
      icon: 'success',
      title: 'Tudo certo!',
      text: 'Funcionário atualizado com sucesso!',
      buttonsStyling: false,
      customClass: { confirmButton: 'btn btn-voltar' }
    });
    history.replaceState({}, document.title, location.pathname);
  }
  
  if (urlParams.get('erro') === 'cpf') {
    Swal.fire({
      icon: 'error',
      title: 'Ops...',
      text: 'Este CPF já está vinculado a um funcionário.',
      buttonsStyling: false,
      customClass: { confirmButton: 'btn btn-voltar' }
    });
    modal.style.display = "flex";
  }
  
  if (urlParams.get('erro') === '1') {
    Swal.fire({
      icon: 'error',
      title: 'Ops...',
      text: 'Ocorreu um erro ao processar a operação.',
        buttonsStyling: false,
      customClass: { confirmButton: 'btn btn-voltar' }
    });
  }

  const cpfInput = document.getElementById('cpf');
  IMask(cpfInput, {
    mask: '000.000.000-00'
  });

  const telInput = document.getElementById('telefone');
  IMask(telInput, {
    mask: '(00) 00000-0000'
  });

  const cpfEditInput = document.getElementById('editarCpf');
  IMask(cpfEditInput, {
    mask: '000.000.000-00'
  });

  const telEditInput = document.getElementById('editarTelefone');
  IMask(telEditInput, {
    mask: '(00) 00000-0000'
  });

  function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const d = new Date(dataISO);
    return d.toLocaleDateString('pt-BR');
  }

  let modalHistoricoSalarial = document.getElementById('modalHistoricoSalarial');
  let modalNovoReajuste = document.getElementById('modalNovoReajuste');
  let funcionarioSelecionadoHistorico = null;

  // Event listeners diretos para os botões de fechar
  const btnFecharReajuste = document.getElementById('fecharModalReajuste');
  const btnFecharHistorico = document.getElementById('fecharModalHistorico');
  
  if (btnFecharReajuste) {
    btnFecharReajuste.addEventListener('click', function(e) {
      console.log('Event listener direto - fechar reajuste');
      e.preventDefault();
      e.stopPropagation();
      fecharModalReajuste();
    });
  }
  
  if (btnFecharHistorico) {
    btnFecharHistorico.addEventListener('click', function(e) {
      console.log('Event listener direto - fechar histórico');
      e.preventDefault();
      e.stopPropagation();
      fecharModalHistorico();
    });
  }

  // Event listener para mostrar/esconder duração do bônus e alterar labels
  const tipoReajusteSelect = document.getElementById('tipoReajuste');
  const duracaoBonusContainer = document.getElementById('duracaoBonusContainer');
  const duracaoBonusSelect = document.getElementById('duracaoBonus');
  const labelSalarioNovo = document.getElementById('labelSalarioNovo');
  const salarioNovoInput = document.getElementById('salarioNovo');
  
  if (tipoReajusteSelect && duracaoBonusContainer) {
    tipoReajusteSelect.addEventListener('change', function() {
      if (this.value === 'Bônus') {
        // Mostrar duração e alterar labels para bônus
        duracaoBonusContainer.style.display = 'block';
        duracaoBonusSelect.required = true;
        labelSalarioNovo.textContent = 'Valor do Bônus:';
        salarioNovoInput.placeholder = 'Digite o valor do bônus a ser adicionado';
        salarioNovoInput.value = '';
      } else {
        // Esconder duração e voltar labels normais
        duracaoBonusContainer.style.display = 'none';
        duracaoBonusSelect.required = false;
        duracaoBonusSelect.value = '';
        labelSalarioNovo.textContent = 'Novo Salário:';
        salarioNovoInput.placeholder = 'Novo salário';
      }
    });
  }

  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-historico')) {
      const btn = e.target.closest('.btn-historico');
      const funcionarioId = btn.dataset.id;
      const funcionarioNome = btn.dataset.nome;
      abrirModalHistorico(funcionarioId, funcionarioNome);
    }
    
    if (e.target.id === 'btnNovoReajuste') {
      abrirModalNovoReajuste();
    }
    
    if (e.target.id === 'fecharModalHistorico') {
      fecharModalHistorico();
    }
    
    if (e.target.id === 'fecharModalReajuste') {
      console.log('Clique no botão fechar modal reajuste detectado');
      fecharModalReajuste();
    }
  });
  
  // Form de novo reajuste
  const formNovoReajuste = document.getElementById('formNovoReajuste');
  if (formNovoReajuste) {
    formNovoReajuste.addEventListener('submit', function(e) {
      e.preventDefault();
      enviarReajuste(this);
    });
  }

  async function abrirModalHistorico(funcionarioId, funcionarioNome) {
    funcionarioSelecionadoHistorico = {
      id: funcionarioId,
      nome: funcionarioNome
    };
    
    document.getElementById('tituloHistorico').textContent = `Histórico Salarial - ${funcionarioNome}`;
    
    try {
      const response = await fetch(`/funcionarios/historico/${funcionarioId}`);
      const data = await response.json();
      
      console.log('Dados recebidos do servidor para histórico:', data);
      
      if (data.success) {
        renderizarHistorico(data.historico, data.estatisticas);
        modalHistoricoSalarial.classList.add('show');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      Swal.fire('Erro', 'Não foi possível carregar o histórico salarial', 'error');
    }
  }

  function renderizarHistorico(historico, estatisticas) {
    console.log('renderizarHistorico chamada com:', { historico, estatisticas });
    const container = document.getElementById('historicoContent');
    
    let html = '';
    
    if (estatisticas && estatisticas.total_reajustes > 0) {
      html += `
        <div class="historico-stats">
          <div class="stat-item">
            <div class="stat-value">${estatisticas.total_reajustes}</div>
            <div class="stat-label">Total de Reajustes</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">R$ ${parseFloat(estatisticas.menor_salario || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            <div class="stat-label">Menor Salário</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">R$ ${parseFloat(estatisticas.maior_salario || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            <div class="stat-label">Maior Salário</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">R$ ${parseFloat(estatisticas.media_aumento || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            <div class="stat-label">Média de Aumento</div>
          </div>
        </div>
      `;
    }
    
    // Renderizar histórico
    if (historico && historico.length > 0) {
      historico.forEach(item => {
        const diferenca = item.salario_novo - item.salario_anterior;
        const percentual = ((diferenca / item.salario_anterior) * 100).toFixed(1);
        
        html += `
          <div class="historico-item">
            <div class="historico-header-item">
              <span class="historico-tipo ${item.tipo.toLowerCase()}">${item.tipo}</span>
              <span class="historico-data">${new Date(item.data_reajuste).toLocaleDateString('pt-BR')}</span>
            </div>
            
            <div class="historico-valores">
              <div class="valor-item valor-anterior">
                <div class="valor-numero">R$ ${parseFloat(item.salario_anterior).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="valor-label">Salário Anterior</div>
              </div>
              <div class="valor-item valor-novo">
                <div class="valor-numero">R$ ${parseFloat(item.salario_novo).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="valor-label">Novo Salário</div>
              </div>
            </div>
            
            <div class="historico-diferenca" style="text-align: center; margin-bottom: 15px;">
              ${item.tipo === 'Bônus' ? `
                <div style="color: #007bff; font-weight: bold; margin-bottom: 5px;">
                  <i class="fas fa-gift"></i> Bônus: +R$ ${diferenca.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </div>
                <div style="color: #28a745; font-size: 0.9em;">
                  Novo salário: R$ ${parseFloat(item.salario_novo).toLocaleString('pt-BR', {minimumFractionDigits: 2})} (+${percentual}%)
                </div>
              ` : `
                <strong style="color: ${diferenca >= 0 ? '#28a745' : '#dc3545'}">
                  ${diferenca >= 0 ? '+' : ''}R$ ${diferenca.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${percentual}%)
                </strong>
              `}
            </div>
            
            ${item.cargo_anterior !== item.cargo_novo ? `
              <div class="historico-cargo" style="margin-bottom: 10px;">
                <strong>Cargo:</strong> ${item.cargo_anterior} → ${item.cargo_novo}
              </div>
            ` : ''}
            
            ${item.motivo ? `
              <div class="historico-motivo">
                <strong>Motivo:</strong> ${item.motivo}
              </div>
            ` : ''}
            
            ${item.tipo === 'Bônus' && item.duracao_meses ? `
              <div class="historico-duracao" style="margin-top: 10px; color: #007bff; font-weight: 500;">
                <i class="fas fa-clock"></i> <strong>Duração:</strong> ${item.duracao_meses} ${item.duracao_meses === 1 ? 'mês' : 'meses'}
              </div>
            ` : ''}
          </div>
        `;
      });
    } else {
      html += `
        <div class="historico-empty">
          <i class="fas fa-history"></i>
          <h4>Nenhum reajuste registrado</h4>
          <p>Este funcionário ainda não possui histórico de reajustes salariais.</p>
        </div>
      `;
    }
    
    container.innerHTML = html;
  }

  function abrirModalNovoReajuste() {
    if (!funcionarioSelecionadoHistorico) {
      Swal.fire('Erro', 'Nenhum funcionário selecionado', 'error');
      return;
    }
    
    console.log('Funcionário selecionado:', funcionarioSelecionadoHistorico);
    const funcionarioAtual = obterDadosFuncionarioAtual();
    
    console.log('Preenchendo campos do formulário...');
    
    const funcionarioIdField = document.getElementById('funcionarioIdReajuste');
    const salarioAnteriorField = document.getElementById('salarioAnterior');
    const cargoAnteriorField = document.getElementById('cargoAnterior');
    const cargoNovoField = document.getElementById('cargoNovo');
    
    funcionarioIdField.value = funcionarioSelecionadoHistorico.id;
    salarioAnteriorField.value = funcionarioAtual.salario;
    cargoAnteriorField.value = funcionarioAtual.cargo;
    cargoNovoField.value = funcionarioAtual.cargo;
    document.getElementById('dataReajuste').value = new Date().toISOString().split('T')[0];
    
    console.log('Campos preenchidos:', {
      funcionario_id: funcionarioIdField.value,
      salario_anterior_calculado: funcionarioAtual.salario,
      salario_anterior_no_campo: salarioAnteriorField.value,
      cargo_anterior: funcionarioAtual.cargo,
      cargo_novo: funcionarioAtual.cargo
    });
    
    modalNovoReajuste.style.display = 'flex';
    modalHistoricoSalarial.classList.remove('show');
  }

  function obterDadosFuncionarioAtual() {
    const linha = document.querySelector(`button[data-id="${funcionarioSelecionadoHistorico.id}"]`).closest('tr');
    console.log('Linha encontrada:', linha);
    
    const salarioElement = linha.querySelector('[data-label="Salário"]');
    const cargoElement = linha.querySelector('[data-label="Função"]');
    
    console.log('Elemento salário:', salarioElement);
    console.log('Elemento cargo:', cargoElement);
    
    // Processar salário corretamente do formato brasileiro (R$ 2.000,00)
    let salarioText = salarioElement ? salarioElement.textContent.trim() : '0';
    console.log('Salário texto original:', salarioText);
    
    // Remover "R$ " e espaços
    salarioText = salarioText.replace('R$ ', '').replace(/\s/g, '');
    
    // Converter formato brasileiro para formato americano
    // Exemplo: "2.000,00" -> "2000.00"
    if (salarioText.includes(',')) {
      // Tem vírgula decimal
      const partes = salarioText.split(',');
      const inteira = partes[0].replace(/\./g, ''); // Remove pontos de milhares
      const decimal = partes[1] || '00';
      salarioText = inteira + '.' + decimal;
    } else {
      // Não tem vírgula, remove pontos (assumindo que são milhares)
      salarioText = salarioText.replace(/\./g, '');
    }
    
    const cargoText = cargoElement ? cargoElement.textContent.trim() : '';
    
    console.log('Salário texto processado:', salarioText);
    console.log('Cargo texto:', cargoText);
    
    const dados = {
      salario: parseFloat(salarioText),
      cargo: cargoText
    };
    
    console.log('Dados do funcionário atual:', dados);
    return dados;
  }

  async function enviarReajuste(form) {
    try {
      const formData = new FormData(form);
      
      // Converter FormData para objeto JSON
      const dados = {};
      for (let [key, value] of formData.entries()) {
        dados[key] = value;
      }
      
      console.log('Dados do reajuste sendo enviados:', dados);
      console.log('Valores específicos:', {
        salario_anterior: dados.salario_anterior,
        salario_anterior_tipo: typeof dados.salario_anterior,
        salario_novo: dados.salario_novo,
        salario_novo_tipo: typeof dados.salario_novo,
        tipo: dados.tipo
      });
      
      const response = await fetch('/funcionarios/reajuste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
      
      const data = await response.json();
      
      if (data.success) {
        Swal.fire('Sucesso', data.message, 'success').then(async () => {
          fecharModalReajuste();
          setTimeout(async () => {
            await abrirModalHistorico(funcionarioSelecionadoHistorico.id, funcionarioSelecionadoHistorico.nome);
          }, 500);
          setTimeout(() => location.reload(), 2000);
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao registrar reajuste:', error);
      Swal.fire('Erro', 'Não foi possível registrar o reajuste: ' + error.message, 'error');
    }
  }

  function fecharModalHistorico() {
    console.log('Função fecharModalHistorico chamada');
    if (modalHistoricoSalarial) {
      modalHistoricoSalarial.classList.remove('show');
      funcionarioSelecionadoHistorico = null;
      console.log('Modal fechado com sucesso');
    } else {
      console.error('Modal não encontrado!');
    }
  }

  function fecharModalReajuste() {
    console.log('Função fecharModalReajuste chamada');
    modalNovoReajuste.style.display = 'none';
    document.getElementById('formNovoReajuste').reset();
  }