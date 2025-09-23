(function () {
  const grid = document.querySelector('.grid-cards');
  if (!grid) return;

  async function patch(id, body) {
    const res = await fetch(`/menu/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  }

  grid.addEventListener('click', async (e) => {
    const btnArq = e.target.closest('.btn-arquivar');
    const btnRes = e.target.closest('.btn-restaurar');
    if (!btnArq && !btnRes) return;

    const card = e.target.closest('.card');
    const id = (btnArq || btnRes).dataset.id;
    const wantArchive = !!btnArq;

    const resp = await patch(id, { arquivado: wantArchive ? 1 : 0 });
    if (!resp.ok) return;
    const d = resp.data || {};
    const isArchived = Number(d.arquivado) === 1;
    const isOn = Number(d.is_disponivel) === 1;

    card.classList.toggle('is-archived', isArchived);

    let badgeArch = card.querySelector('.badge-archived');
    if (isArchived && !badgeArch) {
      const span = document.createElement('span');
      span.className = 'badge badge-archived';
      span.innerHTML = '<i class="fa-solid fa-box-archive"></i> Arquivado';
      card.querySelector('.linha-topo').appendChild(span);
    }
    if (!isArchived && badgeArch) badgeArch.remove();

    const toggle = card.querySelector('.toggle-disponivel');
    if (toggle) toggle.checked = !!isOn;

    const availBadge = card.querySelector('.linha-topo .badge:not(.badge-archived)');
    if (availBadge) {
      availBadge.classList.toggle('badge-on', isOn);
      availBadge.classList.toggle('badge-off', !isOn);
      availBadge.innerText = isOn ? 'Disponível' : 'Indisponível';
    }

    const switchEl = card.querySelector('.switch');
    const editableEls = card.querySelectorAll('.editable');
    if (isArchived) {
      switchEl && (switchEl.style.opacity = .4);
      editableEls.forEach(el => el.style.pointerEvents = 'none');
    } else {
      switchEl && (switchEl.style.opacity = '');
      editableEls.forEach(el => el.style.pointerEvents = '');
    }

    const actions = card.querySelector('.actions');
    if (actions) {
      if (isArchived) {
        const old = actions.querySelector('.btn-arquivar');
        if (old) old.outerHTML = `<button type="button" class="btn-restaurar" data-id="${id}"><i class="fa-solid fa-rotate-left"></i> Restaurar</button>`;
      } else {
        const old = actions.querySelector('.btn-restaurar');
        if (old) old.outerHTML = `<button type="button" class="btn-arquivar" data-id="${id}"><i class="fa-solid fa-box-archive"></i> Arquivar</button>`;
      }
    }
  });
})();
