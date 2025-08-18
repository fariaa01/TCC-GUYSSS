(function () {
  const container = document.getElementById('container');
  const tituloPainel = document.getElementById('tituloPainel');
  const textoPainel = document.getElementById('textoPainel');
  const linkCadastro = document.getElementById('linkCadastro');
  const linkLogin = document.getElementById('linkLogin');

  function moverParaCadastro() {
    if (!container) return;
    container.classList.add('cadastro');
    if (tituloPainel) tituloPainel.textContent = 'Cadastro';
    if (textoPainel) textoPainel.textContent = 'Crie sua conta e comece a usar agora!';
  }
  function moverParaLogin() {
    if (!container) return;
    container.classList.remove('cadastro');
    if (tituloPainel) tituloPainel.textContent = 'Login';
    if (textoPainel) textoPainel.textContent = 'Bem-vindo de volta!';
  }

  if (linkCadastro) linkCadastro.addEventListener('click', (e) => { e.preventDefault(); moverParaCadastro(); });
  if (linkLogin) linkLogin.addEventListener('click', (e) => { e.preventDefault(); moverParaLogin(); });
})();


(function () {
  const input = document.getElementById('senhaCadastro');
  if (!input) return;

  const bar = document.getElementById('pwdBar');
  const label = document.getElementById('pwdLabel');
  const hints = document.querySelectorAll('#pwdHints li');

  const widthClasses = ['w0','w20','w40','w60','w80','w100'];
  const colorClasses = ['c-weak','c-weak','c-fair','c-medium','c-strong','c-excellent'];

  function classify(score) {
    switch (score) {
      case 0: return 'Força: —';
      case 1: return 'Força: Muito fraca';
      case 2: return 'Força: Fraca';
      case 3: return 'Força: Média';
      case 4: return 'Força: Forte';
      case 5: return 'Força: Excelente';
      default: return 'Força: —';
    }
  }

  function updateClasses(el, groups) {
    groups.flat().forEach((cls) => el.classList.remove(cls));
  }

  function onInput() {
    const v = input.value || '';

    const hasLower = /[a-z]/.test(v);
    const hasUpper = /[A-Z]/.test(v);
    const hasNum   = /\d/.test(v);
    const hasSym   = /[^A-Za-z0-9]/.test(v);
    const goodLen  = v.length >= 8;

    const score = [goodLen, hasLower, hasUpper, hasNum, hasSym].reduce((a, b) => a + (b ? 1 : 0), 0);

    // Dicas
    hints.forEach((li) => {
      const req = li.getAttribute('data-req');
      const ok =
        (req === 'len'   && goodLen) ||
        (req === 'lower' && hasLower) ||
        (req === 'upper' && hasUpper) ||
        (req === 'num'   && hasNum)   ||
        (req === 'sym'   && hasSym);
      li.classList.toggle('ok', !!ok);
    });

    // Barra
    const widthIdx = Math.min(score, 5);
    updateClasses(bar, [widthClasses, colorClasses]);
    bar.classList.add(widthClasses[widthIdx], colorClasses[widthIdx]);

    // Label
    label.textContent = classify(score);
  }

  input.addEventListener('input', onInput);
  onInput();
})();

(function () {
  const pwd = document.getElementById('senhaCadastro');
  const confirm = document.getElementById('senhaConfirmacao');
  const msg = document.getElementById('pwdMatchMsg');
  const btn = document.getElementById('btnCadastrar');

  if (!pwd || !confirm || !msg || !btn) return;

  function validateMatch() {
    const pv = pwd.value || '';
    const cv = confirm.value || '';

    const matches = pv.length > 0 && cv.length > 0 && pv === cv;

    confirm.classList.toggle('input-invalid', !matches && cv.length > 0);

    msg.classList.remove('ok', 'error');
    if (cv.length === 0) {
      msg.textContent = 'Repita a senha.';
    } else if (matches) {
      msg.textContent = 'As senhas coincidem.';
      msg.classList.add('ok');
    } else {
      msg.textContent = 'As senhas não coincidem.';
      msg.classList.add('error');
    }

    btn.disabled = !matches;
  }

  pwd.addEventListener('input', validateMatch);
  confirm.addEventListener('input', validateMatch);
  validateMatch();
})();

(function () {
  function toggleFor(button) {
    const id = button.getAttribute('data-for');
    const input = document.getElementById(id);
    if (!input) return;

    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';

    button.classList.toggle('is-visible', isHidden);
    button.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
    button.setAttribute('aria-label', isHidden ? 'Ocultar senha' : 'Mostrar senha');
    button.setAttribute('title', isHidden ? 'Ocultar senha' : 'Mostrar senha');
  }

  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => toggleFor(btn));
  });
})();
