document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent') || document.querySelector('.container') || document.querySelector('main');
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
    if (mainContent) mainContent.classList.toggle('sidebar-hidden');

    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
      icon.classList.add('rotate');
      setTimeout(() => icon.classList.remove('rotate'), 400);
    }
  });
});
