document.addEventListener('click', async function (e) {
  const excluirBtn = e.target.closest('[data-role="excluir"], .form-excluir, .btn-excluir');
  if (!excluirBtn) return;

  e.preventDefault();

  const form = excluirBtn.tagName === 'FORM' ? excluirBtn : (excluirBtn.closest('form') || null);
  const href = excluirBtn.getAttribute ? excluirBtn.getAttribute('href') : null;

  const result = await Swal.fire({
    title: 'Tem certeza?',
    text: 'Você não poderá reverter isso!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#c0392b',
    cancelButtonColor: '#4c4b4b',
    confirmButtonText: 'Sim, excluir!'
  });

  if (result.isConfirmed) {
    if (form) form.submit();
    else if (href) window.location.href = href;
  }
});
