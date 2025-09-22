document.addEventListener("DOMContentLoaded", function() {
    const cnpjInput = document.querySelector('input[name="cnpj"]');
    const telefoneInput = document.querySelector('input[name="telefone"]');
    const telefoneAltInput = document.querySelector('input[name="telefone_alternativo"]');

    const cepInput = document.querySelector('input[name="cep"]');
    const ruaInput = document.querySelector('input[name="rua"]');
    const bairroInput = document.querySelector('input[name="bairro"]');
    const cidadeInput = document.querySelector('input[name="cidade"]');
    const estadoInput = document.querySelector('input[name="estado"]');

    const agenciaInput = document.querySelector('input[name="agencia"]');
    const contaInput = document.querySelector('input[name="conta"]');

    const Form = document.querySelector('form');
    const btnSalvarAlteracoes = document.getElementById('btnSalvarAlteracoes');
    let formOriginal = {};

    if (btnSalvarAlteracoes) {
        btnSalvarAlteracoes.style.display = 'none'; 
    }

    if(Form && btnSalvarAlteracoes) {
        Array.from(Form.elements).forEach(element => {
            if(element.name) {
                formOriginal[element.name] = element.value;
            }
        });

        Form.addEventListener('input', function() {
            let formAlterado = false;
            Array.from(Form.elements).forEach(element => {
                if(element.name && formOriginal[element.name] !== element.value) {
                    formAlterado = true;
                }
            });
            btnSalvarAlteracoes.style.display = formAlterado ? 'inline-block' : 'none';
        });
    }

    if(cnpjInput) {
        IMask(cnpjInput, { mask: '00.000.000/0000-00' });
    }
    if(telefoneInput) {
        IMask(telefoneInput, { mask: '(00) 00000-0000' });
    }
    if(telefoneAltInput) {
        IMask(telefoneAltInput, { mask: '(00) 00000-0000' });
    }
    if(cepInput) {
        IMask(cepInput, { mask: '00000-000' });
    }
    if(agenciaInput) {
        IMask(agenciaInput, { mask: '0000' });
    }
    if(contaInput) {
        IMask(contaInput, { mask: '00000-0' }); 
    }

    cepInput.addEventListener('blur', function() {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length === 8) {
            [ruaInput, bairroInput, cidadeInput, estadoInput].forEach(input => {
                if (input) input.disabled = true;
            });

            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(response => response.json())
                .then(data => {
                    if (!data.erro) {
                        if(ruaInput) ruaInput.value = data.logradouro || '';
                        if(bairroInput) bairroInput.value = data.bairro || '';
                        if(cidadeInput) cidadeInput.value = data.localidade || '';
                        if(estadoInput) estadoInput.value = data.uf || '';
                    } else {
                        Swal.fire('CEP não encontrado', 'Por favor, verifique o CEP informado.', 'error');
                    }
                })
                .catch(() => {
                    Swal.fire('Erro', 'Não foi possível buscar o endereço. Tente novamente mais tarde.', 'error');
                })
                .finally(() => {
                    [ruaInput, bairroInput, cidadeInput, estadoInput].forEach(input => {
                        if (input) input.disabled = false;
                    });
                });
        }
    });
});

function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}