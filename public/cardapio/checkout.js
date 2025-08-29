// public/checkout.js
(function(){
  const $  = (s, r=document)=> r.querySelector(s);
  const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
  const money = v => 'R$ ' + Number(v||0).toFixed(2).replace('.', ',');

  // Elements
  const list        = $('#summaryList');
  const elSubtotal  = $('#sumSubtotal');
  const elTax       = $('#sumTax');
  const elShipping  = $('#sumShipping');
  const elTotal     = $('#sumTotal');
  const fb          = $('#fb');
  const btnFinalizar= $('#btn-finalizar');

  const nome = $('#ch_nome');
  const tel  = $('#ch_tel');
  const end  = $('#ch_end');
  const bai  = $('#ch_bairro');
  const cid  = $('#ch_cidade');
  const uf   = $('#ch_uf');
  const cep  = $('#ch_cep');
  const obs  = $('#ch_obs');

  const tabsAtendimento = $('#tabs-atendimento');
  const enderecoBox     = $('#enderecoBox');
  const tabsPagamento   = $('#tabs-pagamento');

  let modoAtendimento = 'dine';   // dine | pickup | delivery
  let pagamento       = 'cash';   // cash | debit | credit | ewallet
  let freteAtual      = 0;        // se quiser calcular frete quando delivery

  function setEntregaVisibility(){
    enderecoBox.style.display = (modoAtendimento === 'delivery') ? '' : 'none';
  }

  tabsAtendimento?.addEventListener('click', (e)=>{
    const b = e.target.closest('.pay-tab'); if(!b) return;
    $$('.pay-tab', tabsAtendimento).forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    modoAtendimento = b.dataset.mode;
    setEntregaVisibility();
    recalcTotaisUI(); // se quiser aplicar frete diferente para delivery
  });

  tabsPagamento?.addEventListener('click', (e)=>{
    const b = e.target.closest('.pay-tab'); if(!b) return;
    $$('.pay-tab', tabsPagamento).forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    pagamento = b.dataset.pay;
  });

  async function getJSON(u){
    const r = await fetch(u, { credentials:'include' });
    const j = await r.json().catch(()=> ({}));
    if(!r.ok) throw new Error(j?.erro || `Erro ${r.status}`);
    return j;
  }
  async function postJSON(u, body){
    const r = await fetch(u, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      credentials:'include',
      body: JSON.stringify(body||{})
    });
    const j = await r.json().catch(()=> ({}));
    if(!r.ok || j?.erro){
      const err = new Error(j?.erro || `Erro ${r.status}`);
      err.needContact = !!j?.needContact;
      err.needLogin   = !!j?.needLogin;
      throw err;
    }
    return j;
  }

  function renderItems(itens){
    list.innerHTML = '';
    if(!itens?.length){
      list.innerHTML = '<p class="muted">Seu carrinho está vazio.</p>';
      elSubtotal.textContent = money(0);
      elTax.textContent      = money(0);
      elShipping.textContent = money(0);
      elTotal.textContent    = money(0);
      btnFinalizar.disabled  = true;
      return { subtotal:0 };
    }
    let subtotal = 0;
    for(const it of itens){
      const q = Number(it.quantidade||1);
      const pu = Number(it.preco_unitario ?? it.preco ?? 0);
      const st = Number(it.subtotal ?? pu*q);
      subtotal += st;

      const row = document.createElement('div');
      row.className = 'item';
      row.innerHTML = `
        <div class="name">${it.nome_produto || it.nome}</div>
        <div class="qtd">x${q}</div>
        <div class="price">${money(st)}</div>
      `;
      list.appendChild(row);
    }
    btnFinalizar.disabled = false;
    return { subtotal };
  }

  function recalcTotaisUI(subtotalCached){
    // você pode calcular taxas/frete aqui
    const subtotal = typeof subtotalCached === 'number' ? subtotalCached :
      Number((elSubtotal.textContent||'0').replace('R$','').replace('.','').replace(',','.')) || 0;

    const taxas = 0;
    const frete = (modoAtendimento === 'delivery') ? freteAtual : 0;
    const total = subtotal + taxas + frete;

    elSubtotal.textContent = money(subtotal);
    elTax.textContent      = money(taxas);
    elShipping.textContent = money(frete);
    elTotal.textContent    = money(total);
  }

  async function boot(){
    try{
      const data = await getJSON('/carrinho');
      const { subtotal } = renderItems(data?.itens || []);
      recalcTotaisUI(subtotal);
      setEntregaVisibility();
    }catch(e){
      fb.textContent = e.message || 'Falha ao carregar o pedido';
      btnFinalizar.disabled = true;
    }
  }

  $('#formCheckout')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    fb.textContent = '';
    btnFinalizar.disabled = true;
    try{
      // validações mínimas
      const nomeV = (nome?.value||'').trim();
      const telV  = (tel?.value||'').trim();
      if(!nomeV || !telV){
        fb.textContent = 'Preencha nome e telefone para finalizar.';
        btnFinalizar.disabled = false;
        return;
      }
      // endereço só se delivery
      const entrega = (modoAtendimento === 'delivery') ? {
        endereco: (end?.value||'').trim(),
        bairro:   (bai?.value||'').trim(),
        cidade:   (cid?.value||'').trim(),
        uf:       (uf?.value||'').trim(),
        cep:      (cep?.value||'').trim(),
      } : {};

      const payload = {
        observacoes: (obs?.value||'').trim(),
        statusFinal: 'aberto',
        contato: { nome: nomeV, telefone: telV },
        entrega
      };

      await postJSON('/carrinho/checkout', payload);
      // sucesso → vai para lista de pedidos (ou página de sucesso)
      window.location.href = '/pedidos';
    }catch(e){
      if(e.needContact){
        fb.textContent = 'Preencha nome e telefone para finalizar.';
      }else{
        fb.textContent = e.message || 'Erro ao finalizar';
      }
      btnFinalizar.disabled = false;
    }
  });

  boot();
})();
