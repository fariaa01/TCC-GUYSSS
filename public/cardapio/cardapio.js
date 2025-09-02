// /public/cardapio/cardapio.js
(function () {
  const money = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ========= Estado global (para reexecutar ação após login) =========
  let pendingAction = null;

  // ========= Modal de autenticação =========
  const authModal       = $('#authModal');
  const paneLogin       = $('#pane-login');
  const paneCadastro    = $('#pane-cadastro');
  const tabLogin        = $('#tab-login');
  const tabCadastro     = $('#tab-cadastro');
  const formLogin       = $('#formLogin');
  const formCadastro    = $('#formCadastro');
  const loginFeedback   = $('#loginFeedback');
  const cadastroFeedback= $('#cadastroFeedback');

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
  function openAuth(which='login'){
    if (!authModal) return;
    switchTab(which);
    authModal.classList.add('open');
    setTimeout(() => {
      const first = which === 'login' ? $('input[name="email"]', formLogin) : $('input[name="nome"]', formCadastro);
      first?.focus();
    }, 0);
  }
  function closeAuth(){
    authModal?.classList.remove('open');
    loginFeedback && (loginFeedback.textContent = '');
    cadastroFeedback && (cadastroFeedback.textContent = '');
    formLogin?.reset();
    formCadastro?.reset();
  }
  tabLogin?.addEventListener('click', () => switchTab('login'));
  tabCadastro?.addEventListener('click', () => switchTab('cadastro'));
  $$('.auth-close, [data-close-auth]').forEach(el => el.addEventListener('click', () => { pendingAction=null; closeAuth(); }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal?.classList.contains('open')) { pendingAction=null; closeAuth(); }
  });

  // ========= Helpers de API =========
  async function rawFetch(url, opts = {}) {
    const headers = { Accept: 'application/json', ...(opts.headers || {}) };
    const r = await fetch(url, { credentials: 'include', ...opts, headers });

    let data = {};
    try { data = await r.json(); } catch {}

    if (r.status === 401 || data?.authRequired) {
      const err = new Error('Login necessário');
      err.authRequired = true;
      err.response = data;
      throw err;
    }

    if (!r.ok) {
      const err = new Error(data?.erro || data?.error || `Erro ${r.status}`);
      err.response = data;
      throw err;
    }

    return data;
  }
  const getJSON  = (url)                => rawFetch(url);
  const postJSON = (url, body={})       => rawFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  // Confirma sessão após login/cadastro (evita reabrir modal por 401 logo em seguida)
  async function waitForLogin(tries = 6, delayMs = 200) {
    for (let i = 0; i < tries; i++) {
      try {
        const s = await getJSON('/api/cliente/status');
        if (s?.loggedIn) return true;
      } catch {}
      await new Promise(r => setTimeout(r, delayMs));
    }
    return false;
  }

  // ========= Estado e elementos =========
  let carrinho = { pedidoId: null, itens: [], total: 0 };
  const container   = $('#carrinho-container');
  const elSubtotal  = $('#subtotal');
  const elTaxas     = $('#taxas');
  const elTotal     = $('#total');
  const badge       = $('#badge-carrinho');

  const cartPanel    = $('#cart');
  const cartBackdrop = $('#cartBackdrop');
  const btnToggle    = $('#btnToggleCart');
  const btnClose     = $('#closeCart');

  // Endpoints dinâmicos via data-*
  const endpoints = {
    listar:    cartPanel?.dataset.endpointListar || btnToggle?.dataset.endpointListar || '/carrinho',
    adicionar: '/carrinho/adicionar', // pode ser sobrescrito por data-endpoint-adicionar no botão
    atualizar: cartPanel?.dataset.endpointAtualizar || '/carrinho/atualizar',
    remover:   cartPanel?.dataset.endpointRemover   || '/carrinho/remover',
    finalizar: cartPanel?.dataset.endpointFinalizar || '/carrinho/finalizar',
  };

  const TAXA_FIXA = 0;
  const TAXA_PERCENTUAL = 0;

  let modoPedido = 'dine';
  let formaPagamento = 'cash';

  // ========= Render =========
  function updateBadgeFromCart() {
    if (!badge) return;
    const totalQtd = (carrinho.itens || []).reduce((s, i) => s + Number(i.quantidade || 0), 0);
    badge.textContent = totalQtd;
    badge.style.display = totalQtd > 0 ? 'inline-block' : 'none';
  }

  function calcTotais(itens) {
    const subtotal = itens.reduce((s, i) => s + Number(i.subtotal ?? (Number(i.preco_unitario || 0) * Number(i.quantidade || 0))), 0);
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
      await guarded(() => apiUpdateQty(id, Math.max(1, Number(cur) - 1)));
    });
    row.querySelector('.mais')?.addEventListener('click', async () => {
      const cur = carrinho.itens.find(x => String(x.id) === String(id))?.quantidade || 1;
      await guarded(() => apiUpdateQty(id, Number(cur) + 1));
    });
    row.querySelector('.qty')?.addEventListener('change', async (e) => {
      const v = Math.max(1, Number(e.target.value) || 1);
      await guarded(() => apiUpdateQty(id, v));
    });
    row.querySelector('.remover')?.addEventListener('click', async () => {
      await guarded(() => apiRemoveItem(id));
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

  // ========= Carregamento do carrinho =========
  async function loadCart() {
    const data = await getJSON(endpoints.listar);
    const itens = Array.isArray(data?.itens) ? data.itens : [];
    carrinho = {
      pedidoId: data?.pedidoId ?? null,
      itens: itens.map(i => ({
        id: i.id,
        produto_id: i.produto_id ?? i.id_produto ?? null,
        nome_produto: i.produto_nome || i.nome_produto || i.nome || 'Item',
        preco_unitario: Number(i.preco_unitario ?? i.preco ?? 0),
        quantidade: Number(i.quantidade ?? 1),
        subtotal: Number(i.subtotal ?? ((Number(i.preco_unitario ?? i.preco ?? 0))*(Number(i.quantidade ?? 1)))) ,
        img: i.img,
        imagem: i.imagem
      })),
      total: Number(data?.total ?? 0)
    };
    renderCart();
  }

  // ========= Chamada protegida =========
  async function guarded(fn) {
    try {
      return await fn();
    } catch (e) {
      if (e?.authRequired) {
        pendingAction = fn;       // reexecuta depois do login
        openAuth('login');
        return;
      }
      console.error(e);
      throw e; // erros reais não disparam o modal
    }
  }

  // ========= API do carrinho =========
  async function apiAddItem({ endpoint, produto_id, quantidade = 1 }) {
    await postJSON(endpoint || endpoints.adicionar, { produto_id, quantidade });
    await loadCart();
  }
  async function apiUpdateQty(item_id, quantidade) {
    await postJSON(endpoints.atualizar, { item_id, quantidade });
    await loadCart();
  }
  async function apiRemoveItem(item_id) {
    await postJSON(endpoints.remover, { item_id });
    await loadCart();
  }
  async function apiClearCart() {
    for (const it of (carrinho.itens || [])) {
      await apiRemoveItem(it.id);
    }
  }

  // ========= Botões "Adicionar" nos cards =========
  $$('.adicionar-carrinho').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const produto_id = Number(
        btn.dataset.produtoId ||
        btn.getAttribute('data-produto-id') ||
        btn.dataset.id ||
        btn.getAttribute('data-id')
      );
      const endpointAdd = btn.dataset.endpointAdicionar || endpoints.adicionar;

      if (!Number.isFinite(produto_id) || produto_id <= 0) {
        console.warn('ID de produto inválido no botão', btn);
        return;
      }

      btn.disabled = true;
      const original = btn.textContent;
      try {
        await guarded(() => apiAddItem({ endpoint: endpointAdd, produto_id, quantidade: 1 }));
        btn.textContent = 'Adicionado!';
        setTimeout(() => { btn.textContent = original; }, 900);
      } catch {
        btn.textContent = 'Erro';
        setTimeout(() => { btn.textContent = original; }, 900);
      } finally {
        btn.disabled = false;
      }
    });
  });

  // ========= Filtros =========
  const chips = $$('.chip');
  const verTudo = $('#btnVerTudo') || $('.btn-primary');
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

  // ========= Tabs modo & pagamentos =========
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

  // ========= Painel do carrinho =========
  function openCart() {
    cartPanel?.classList.add('is-open');
    cartBackdrop?.classList.add('show');
  }
  function closeCart() {
    cartPanel?.classList.remove('is-open');
    cartBackdrop?.classList.remove('show');
  }

  btnToggle?.addEventListener('click', async () => {
    await guarded(loadCart); // se 401 → abre login
    if (!authModal?.classList.contains('open')) openCart();
  });
  btnClose?.addEventListener('click', closeCart);
  cartBackdrop?.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  // Limpar carrinho
  $('#limpar')?.addEventListener('click', async () => {
    try { await guarded(apiClearCart); } catch (e) { console.error(e); }
  });

  // ========= Proteção do checkout =========
  const btnCheckout = document.getElementById('ir-checkout');
  btnCheckout?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await guarded(loadCart);
      if (authModal?.classList.contains('open')) {
        pendingAction = () => { window.location.href = '/checkout'; };
      } else {
        window.location.href = '/checkout';
      }
    } catch {
      openAuth('login');
      pendingAction = () => { window.location.href = '/checkout'; };
    }
  });

  // ========= Início =========
  loadCart().catch((e) => {
    if (!e?.authRequired) {
      console.error('Falha ao carregar carrinho:', e);
    }
    if (container) container.innerHTML = '<div class="cart-empty"><p>Seu carrinho está vazio.</p></div>';
    if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
    if (elSubtotal) elSubtotal.textContent = money(0);
    if (elTaxas)    elTaxas.textContent    = money(0);
    if (elTotal)    elTotal.textContent    = money(0);
  });

  // ========= Login / Cadastro =========
  async function postAuth(url, payload){
    return postJSON(url, payload);
  }

  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginFeedback && (loginFeedback.textContent = '');
    const btn = formLogin.querySelector('.auth-submit');
    btn && (btn.disabled = true);
    try {
      const endpoint = formLogin.getAttribute('data-endpoint-login') || '/cliente/login';
      const form = new FormData(formLogin);
      const payload = {
        email: form.get('email'),
        senha: form.get('senha'),
        next:  form.get('next') || ''
      };
      await postAuth(endpoint, payload);
      await waitForLogin(); // <- confirma sessão antes de seguir
      closeAuth();
      if (typeof pendingAction === 'function') {
        const fn = pendingAction; pendingAction = null;
        await fn();
      } else {
        await loadCart();
      }
    } catch (err) {
      loginFeedback && (loginFeedback.textContent = err.message || 'Falha no login');
    } finally {
      btn && (btn.disabled = false);
    }
  });

  formCadastro?.addEventListener('submit', async (e) => {
    e.preventDefault();
    cadastroFeedback && (cadastroFeedback.textContent = '');
    const btn = formCadastro.querySelector('.auth-submit');
    btn && (btn.disabled = true);
    try {
      const endpoint = formCadastro.getAttribute('data-endpoint-cadastro') || '/cliente/cadastrar';
      const form = new FormData(formCadastro);
      const payload = {
        nome:  form.get('nome'),
        email: form.get('email'),
        senha: form.get('senha'),
        next:  form.get('next') || ''
      };
      await postAuth(endpoint, payload);
      await waitForLogin(); // <- confirma sessão antes de seguir
      closeAuth();
      if (typeof pendingAction === 'function') {
        const fn = pendingAction; pendingAction = null;
        await fn();
      } else {
        await loadCart();
      }
    } catch (err) {
      cadastroFeedback && (cadastroFeedback.textContent = err.message || 'Falha no cadastro');
    } finally {
      btn && (btn.disabled = false);
    }
  });

  const abrirAuthBtns = document.querySelectorAll('[data-open-auth]');
  abrirAuthBtns.forEach(b => b.addEventListener('click', () => openAuth('login')));
})();
