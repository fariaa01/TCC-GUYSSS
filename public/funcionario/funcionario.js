const modal = document.getElementById("modalFuncionario");
  const btnAbrir = document.getElementById("btnNovoFuncionario");
  const btnFechar = document.getElementById("fecharModal");

  btnAbrir.addEventListener("click", () => modal.style.display = "flex");
  btnFechar.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
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

  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get('success') === '1') {
    Swal.fire({
      icon: 'success',
      title: 'Funcionário cadastrado com sucesso!',
      showConfirmButton: false,
      timer: 2000
    });
  }
  if (urlParams.get('erro') === 'cpf') {
  Swal.fire({
    icon: 'error',
    title: 'CPF já cadastrado!',
    text: 'Este CPF já está vinculado a um funcionário.',
    confirmButtonColor: '#e74c3c'
  });

  modal.style.display = "flex";
}

  const cpfInput = document.getElementById('cpf');
  IMask(cpfInput, {
    mask: '000.000.000-00'
  });

  const telInput = document.getElementById('telefone');
  IMask(telInput, {
    mask: '(00) 00000-0000'
  });