document.addEventListener('DOMContentLoaded', () => {
  const cnpjCreateInput = document.getElementById('cnpj');
  if(cnpjCreateInput) IMask(cnpjCreateInput, { mask: '00.000.000/0000-00' });

  const telCreateInput = document.getElementById('telefone');
  if(telCreateInput) IMask(telCreateInput, { mask: '(00) 00000-0000' });

  const selectTelAltCreate = document.getElementById('temTelefoneAlternativoCreate');
  const telAltInputCreate = document.getElementById('telefoneAlternativoCreate');
  if(telAltInputCreate) IMask(telAltInputCreate, { mask: '(00) 00000-0000' });

  if(selectTelAltCreate && telAltInputCreate) {
    selectTelAltCreate.addEventListener('change', function() {
      if(this.value === 'sim') {
        telAltInputCreate.style.display = 'block';
      } else {
        telAltInputCreate.style.display = 'none';
        telAltInputCreate.value = '';
      }
    });
  }

  const modalCreate = document.getElementById("modalFornecedor");
  const btnOpenCreate = document.getElementById("btnAdicionarFornecedor");
  const btnFecharCreate = document.getElementById("fecharModalFornecedor");
  const formCreate = document.getElementById("formFornecedor");

  btnOpenCreate.addEventListener('click', () => {
    formCreate.reset();
    selectTelAltCreate.value = 'nao';
    telAltInputCreate.style.display = 'none';
    modalCreate.style.display = 'flex';
  });

  btnFecharCreate.addEventListener('click', () => modalCreate.style.display = 'none');
  window.addEventListener('click', e => { if(e.target === modalCreate) modalCreate.style.display = 'none'; });

  formCreate.addEventListener('submit', e => {
    modalCreate.style.display = 'none';
    Swal.fire({ title: 'Adicionando fornecedor...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  });

  const formDelete = document.createElement('form');
  formDelete.method = 'POST';
  formDelete.style.display = 'none';
  document.body.appendChild(formDelete);

  document.querySelectorAll('.deletar-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const id = btn.dataset.id;
      Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, deletar!',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if(result.isConfirmed) {
          formDelete.setAttribute('action', `/fornecedores/${id}/delete`);
          formDelete.submit();
        }
      });
    });
  });
});