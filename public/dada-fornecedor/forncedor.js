    const modal = document.getElementById("modalEditarFornecedor");
    const btnabrir = document.querySelectorAll(".editar-btn");
    const btnFechar = document.querySelector(".close");

    document.querySelectorAll('.editar-btn').forEach(btn => { 
        btn.addEventListener("click", () => {
            const row = btn.closest('tr');
            const nome = row.children[0].textContent;
            const email = row.children[1].textContent;
            const cnpj = row.children[2].textContent;
            const telefone = row.children[3].textContent;
            const id = btn.getAttribute('data-id');

            document.getElementById('editarId').value = id;
            document.getElementById('editarNome').value = nome;
            document.getElementById('editarCNPJ').value = cnpj;
            document.getElementById('editarTelefone').value = telefone;
            document.getElementById('editarEmail').value = email;

            document.getElementById('formEditarFornecedor').setAttribute('action', `/fornecedores/${id}/update`);

            modal.style.display = "flex";
        });
    });

    btnabrir.forEach(btn => {
        btn.addEventListener("click", () => modal.style.display = "flex");
    });

    btnFechar.addEventListener("click", () => modal.style.display = "none");

    window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
    });

    const urlParams = new URLSearchParams(window.location.search);

    document.addEventListener('DOMContentLoaded', function() {
        const cnpjInput = document.getElementById('editarCNPJ');
        if (cnpjInput) {
            IMask(cnpjInput, { mask: '00.000.000/0000-00' });
        }
    });

    const telInput = document.getElementById('editarTelefone');
    IMask(telInput, {
    mask: '(00) 00000-0000'
    });

    document.getElementById('formEditarFornecedor').addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(this);
        const actionUrl = this.action;

        fetch(actionUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                modal.style.display = "none";
            } else {
                console.error('Erro ao editar fornecedor');
            }
        });
    });