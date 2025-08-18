(function () {
  const input = document.getElementById('foto');
  const dz = document.getElementById('dropzone');
  const thumb = document.getElementById('dzThumb');
  const nameOut = document.getElementById('nome-arquivo');
  if (!input || !dz) return;

  function formatFileName(name, max = 18) {
    name = name.replace(/^.*[\\/]/, '');
    const dot = name.lastIndexOf('.');
    const ext = dot > -1 ? name.slice(dot) : '';
    const base = dot > -1 ? name.slice(0, dot) : name;
    if (base.length <= max) return base + ext;
    const head = base.slice(0, Math.ceil(max * 0.6));
    const tail = base.slice(-Math.floor(max * 0.2) || -2);
    return `${head}…${tail}${ext}`;
  }

  function setFile(file) {
    if (!file) {
      nameOut.textContent = '';
      dz.classList.remove('has-image');
      thumb.style.backgroundImage = '';
      return;
    }
    nameOut.textContent = formatFileName(file.name);
    const url = URL.createObjectURL(file);
    thumb.style.backgroundImage = `url("${url}")`;
    dz.classList.add('has-image');
    thumb.onload = () => URL.revokeObjectURL(url);
  }

  input.addEventListener('change', () => setFile(input.files?.[0]));

  ['dragenter', 'dragover'].forEach(evt =>
    dz.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); dz.style.borderColor = '#111827'; })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dz.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); dz.style.borderColor = ''; })
  );
  dz.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type?.startsWith('image/')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      setFile(file);
    }
  });
})();
