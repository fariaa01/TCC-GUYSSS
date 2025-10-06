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

  // Manter compatibilidade com parâmetros antigos
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