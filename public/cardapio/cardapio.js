(function () {
  const money = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ==== Helpers de API (carrinho no servidor) ====
  async function getJSON(url) {
    const r = await fetch(url, { credentials: 'include' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.erro || `Erro ${r.status}`);
    return data;
  }
  async function sendJSON(method, url, body) {
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: method === 'DELETE' ? undefined : JSON.stringify(body || {})
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data?.erro) throw new Error(data?.erro || `Erro ${r.status}`);
    return data;
  }

  // ==== Estado e elementos ====
  let carrinho = { pedido: null, itens: [] };
  const container   = $('#carrinho-container');
  const elSubtotal  = $('#subtotal');
  const elTaxas     = $('#taxas');
  const elTotal     = $('#total');
  const badge       = $('#badge-carrinho');

  const TAXA_FIXA = 0;
  const TAXA_PERCENTUAL = 0;

  let modoPedido = 'dine';
  let formaPagamento = 'cash';

  // ==== Renderização ====
  function updateBadgeFromCart() {
    if (!badge) return;
    const totalQtd = (carrinho.itens || []).reduce((s, i) => s + Number(i.quantidade || 0), 0);
    badge.textContent = totalQtd;
    badge.style.display = totalQtd > 0 ? 'inline-block' : 'none';
  }

  function calcTotais(itens) {
    const subtotal = itens.reduce((s, i) => s + Number(i.subtotal || (Number(i.preco_unitario || 0) * Number(i.quantidade || 0))), 0);
    const taxas = TAXA_FIXA + subtotal * TAXA_PERCENTUAL;
    return { subtotal, taxas, total: subtotal + taxas };
  }

  function rowHTML(it) {
    const precoUnit = Number(it.preco_unitario ?? it.preco ?? 0);
    const img = it.img || (it.imagem ? ('/uploads/' + it.imagem) : '');
    return `
      <div class="item" data-id="${it.id}">
        ${img ? `<img src="${img}" alt="${it.nome_produto || it.nome || 'Item'}">` : '<div class="noimg"></div>'}
        <div class="info">
          <span class="nome">${it.nome_produto || it.nome || 'Item'}</span>
          <span class="preco-unit">${money(precoUnit)} / un.</span>
        </div>
        <div class="acoes">
          <button class="menos" aria-label="Diminuir">−</button>
          <input class="qty" type="number" min="1" value="${it.quantidade || 1}">
          <button class="mais" aria-label="Aumentar">+</button>
          <button class="remover" aria-label="Remover">🗑️</button>
        </div>
      </div>
    `;
  }

  function bindRow(row) {
    const id = row.getAttribute('data-id');
    row.querySelector('.menos')?.addEventListener('click', async () => {
      const cur = carrinho.itens.find(x => String(x.id) === String(id))?.quantidade || 1;
      await apiUpdateQty(id, Math.max(1, Number(cur) - 1));
    });
    row.querySelector('.mais')?.addEventListener('click', async () => {
      const cur = carrinho.itens.find(x => String(x.id) === String(id))?.quantidade || 1;
      await apiUpdateQty(id, Number(cur) + 1);
    });
    row.querySelector('.qty')?.addEventListener('change', async (e) => {
      const v = Math.max(1, Number(e.target.value) || 1);
      await apiUpdateQty(id, v);
    });
    row.querySelector('.remover')?.addEventListener('click', async () => {
      await apiRemoveItem(id);
    });
  }

  function renderCart() {
    if (!container) return;
    const itens = carrinho.itens || [];
    if (!itens.length) {
      container.innerHTML = '<div class="cart-empty"><p>Seu carrinho está vazio.</p></div>';
      elSubtotal.textContent = money(0);
      elTaxas.textContent    = money(0);
      elTotal.textContent    = money(0);
      updateBadgeFromCart();
      return;
    }
    container.innerHTML = itens.map(rowHTML).join('');
    $$('.item', container).forEach(bindRow);

    const { subtotal, taxas, total } = calcTotais(itens);
    elSubtotal.textContent = money(subtotal);
    elTaxas.textContent    = money(taxas);
    elTotal.textContent    = money(total);
    updateBadgeFromCart();
  }

  // ==== API específicas ====
  async function loadCart() {
    const data = await getJSON('/carrinho');
    // Normaliza itens vindos do backend
    const itens = Array.isArray(data?.itens) ? data.itens : [];
    carrinho = {
      pedido: data?.pedido || null,
      itens: itens.map(i => ({
        id: i.id,
        produto_id: i.produto_id ?? i.id_produto ?? null,
        nome_produto: i.nome_produto || i.nome || 'Item',
        preco_unitario: Number(i.preco_unitario ?? i.preco ?? 0),
        quantidade: Number(i.quantidade ?? 1),
        subtotal: Number(i.subtotal ?? ((Number(i.preco_unitario ?? i.preco ?? 0))*(Number(i.quantidade ?? 1)))),
        img: i.img,
        imagem: i.imagem
      }))
    };
    renderCart();
  }

  async function apiAddItem({ produto_id, nome, preco, qtd = 1, imagem = '' }) {
    await sendJSON('POST', '/carrinho/itens', { produto_id, nome, preco, qtd, imagem });
    await loadCart();
  }

  async function apiUpdateQty(itemId, quantidade) {
    await sendJSON('PATCH', `/carrinho/itens/${itemId}`, { quantidade });
    await loadCart();
  }

  async function apiRemoveItem(itemId) {
    await sendJSON('DELETE', `/carrinho/itens/${itemId}`);
    await loadCart();
  }

  async function apiClearCart() {
    // não há endpoint específico; removemos item a item
    for (const it of (carrinho.itens || [])) {
      await apiRemoveItem(it.id);
    }
  }

  // ==== Botões "Adicionar" nos cards (agora chamam o backend) ====
  $$('.adicionar-carrinho').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const produto_id = Number(btn.dataset.id);
        const nome  = btn.dataset.nome || 'Item';
        const preco = Number(btn.dataset.preco || 0);
        const imagem = btn.dataset.img || '';
        await apiAddItem({ produto_id, nome, preco, qtd: 1, imagem });
        btn.textContent = 'Adicionado!';
        setTimeout(() => { btn.textContent = 'Adicionar'; }, 900);
      } catch (e) {
        console.error(e);
        btn.textContent = 'Erro';
        setTimeout(() => { btn.textContent = 'Adicionar'; }, 900);
      }
    });
  });

  // ==== Filtros de categorias (UI existente) ====
  const chips = $$('.chip');
  const verTudo = $('.btn-primary');
  const cards = $$('.grid-cards .card');

  function aplicarFiltro(cat) {
    cards.forEach((card) => {
      const c = (card.getAttribute('data-cat') || 'Outros').toLowerCase();
      card.style.display = cat === 'todos' || c === cat.toLowerCase() ? '' : 'none';
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      aplicarFiltro(chip.textContent.trim());
    });
  });

  verTudo?.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('is-active'));
    aplicarFiltro('todos');
  });

  // ==== Tabs modo/forma de pagamento ====
  $$('.tab').forEach((t) => {
    t.addEventListener('click', () => {
      $$('.tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      modoPedido = t.dataset.mode;
    });
  });

  $$('.pay').forEach((p) => {
    p.addEventListener('click', () => {
      $$('.pay').forEach((x) => x.classList.remove('active'));
      p.classList.add('active');
      formaPagamento = p.dataset.pay;
    });
  });

  // ==== Painel do carrinho (open/close) ====
  const cartPanel = $('#cart');
  const cartBackdrop = $('#cartBackdrop');
  const btnToggle = $('#btnToggleCart');
  const btnClose = $('#closeCart');

  function openCart() {
    cartPanel?.classList.add('is-open');
    cartBackdrop?.classList.add('show');
  }
  function closeCart() {
    cartPanel?.classList.remove('is-open');
    cartBackdrop?.classList.remove('show');
  }

  btnToggle?.addEventListener('click', openCart);
  btnClose?.addEventListener('click', closeCart);
  cartBackdrop?.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  // Limpar carrinho (server-side via loop)
  $('#limpar')?.addEventListener('click', async () => {
    try {
      await apiClearCart();
    } catch (e) {
      console.error(e);
    }
  });

  // Start
  loadCart().catch((e) => {
    console.error('Falha ao carregar carrinho:', e);
    // Mostra vazio se der erro
    if (container) container.innerHTML = '<div class="cart-empty"><p>Não foi possível carregar seu carrinho.</p></div>';
    if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
    if (elSubtotal) elSubtotal.textContent = money(0);
    if (elTaxas)    elTaxas.textContent    = money(0);
    if (elTotal)    elTotal.textContent    = money(0);
  });
})();

// ============ MODAL LOGIN/CADASTRO & CHECKOUT PROTECT ============
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const authModal = $('#authModal');
  const paneLogin = $('#pane-login');
  const paneCadastro = $('#pane-cadastro');
  const tabLogin = $('#tab-login');
  const tabCadastro = $('#tab-cadastro');
  const formLogin = $('#formLogin');
  const formCadastro = $('#formCadastro');
  const loginFeedback = $('#loginFeedback');
  const cadastroFeedback = $('#cadastroFeedback');

  function openAuth(which='login'){
    if (!authModal) return;
    authModal.classList.add('open');
    switchTab(which);
    setTimeout(() => {
      const first = which === 'login' ? $('input[name="email"]', formLogin) : $('input[name="nome"]', formCadastro);
      first?.focus();
    }, 0);
  }
  function closeAuth(){
    authModal?.classList.remove('open');
    if (loginFeedback) loginFeedback.textContent = '';
    if (cadastroFeedback) cadastroFeedback.textContent = '';
    formLogin?.reset();
    formCadastro?.reset();
  }
  function switchTab(which){
    if (!tabLogin || !tabCadastro || !paneLogin || !paneCadastro) return;
    const isLogin = which === 'login';
    tabLogin.classList.toggle('is-active', isLogin);
    tabCadastro.classList.toggle('is-active', !isLogin);
    paneLogin.classList.toggle('is-active', isLogin);
    paneCadastro.classList.toggle('is-active', !isLogin);
    paneCadastro.hidden = isLogin;
    paneLogin.hidden = !isLogin;
    tabLogin.setAttribute('aria-selected', isLogin ? 'true' : 'false');
    tabCadastro.setAttribute('aria-selected', !isLogin ? 'true' : 'false');
  }

  tabLogin?.addEventListener('click', () => switchTab('login'));
  tabCadastro?.addEventListener('click', () => switchTab('cadastro'));
  $$('.auth-close, [data-close-auth]').forEach(el => el.addEventListener('click', closeAuth));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal?.classList.contains('open')) closeAuth();
  });

  // Protege o Checkout: se não logado, abre modal
  const btnCheckout = document.getElementById('ir-checkout');
  btnCheckout?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const r = await fetch('/api/cliente/status', { credentials: 'include' });
      const data = await r.json();
      if (data?.loggedIn) {
        window.location.href = '/checkout';
      } else {
        openAuth('login');
      }
    } catch (err) {
      console.error(err);
      openAuth('login');
    }
  });

  async function postJSON(url, payload){
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(()=> ({}));
    if (!r.ok || data?.erro) throw new Error(data?.erro || `Erro ${r.status}`);
    return data;
  }

  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginFeedback.textContent = '';
    const btn = formLogin.querySelector('.auth-submit');
    btn.disabled = true;
    try {
      const form = new FormData(formLogin);
      const payload = {
        email: form.get('email'),
        senha: form.get('senha'),
        next: form.get('next') || '/checkout'
      };
      const data = await postJSON('/cliente/login', payload);
      closeAuth();
      // após login, o backend deve mesclar o carrinho anônimo no do cliente
      window.location.href = data?.redirect || '/checkout';
    } catch (err) {
      loginFeedback.textContent = err.message || 'Falha no login';
    } finally {
      btn.disabled = false;
    }
  });

  formCadastro?.addEventListener('submit', async (e) => {
    e.preventDefault();
    cadastroFeedback.textContent = '';
    const btn = formCadastro.querySelector('.auth-submit');
    btn.disabled = true;
    try {
      const form = new FormData(formCadastro);
      const payload = {
        nome: form.get('nome'),
        email: form.get('email'),
        senha: form.get('senha'),
        next: form.get('next') || '/checkout'
      };
      const data = await postJSON('/cliente/cadastrar', payload);
      closeAuth();
      window.location.href = data?.redirect || '/checkout';
    } catch (err) {
      cadastroFeedback.textContent = err.message || 'Falha no cadastro';
    } finally {
      btn.disabled = false;
    }
  });

  const abrirAuthBtns = document.querySelectorAll('[data-open-auth]');
  abrirAuthBtns.forEach(b => b.addEventListener('click', () => openAuth('login')));
})();
