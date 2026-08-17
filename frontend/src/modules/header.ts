interface HeaderControls {
  drawer: HTMLElement;
  burger: HTMLElement;
}

function openDrawer(controls: HeaderControls): void {
  controls.drawer.classList.add('drawer--open');
  controls.drawer.setAttribute('aria-hidden', 'false');
  controls.burger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(controls: HeaderControls): void {
  controls.drawer.classList.remove('drawer--open');
  controls.drawer.setAttribute('aria-hidden', 'true');
  controls.burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function handleHeaderAction(action: string, controls: HeaderControls): void {
  if (action === 'open-menu') {
    openDrawer(controls);
    return;
  }
  if (action === 'close-menu' || action === 'nav-link') {
    closeDrawer(controls);
  }
}

export function initHeader(): void {
  const drawer = document.getElementById('mobile-drawer');
  const burger = document.querySelector<HTMLElement>('[data-action="open-menu"]');

  if (!drawer || !burger) {
    return;
  }

  const controls: HeaderControls = { drawer, burger };

  document.body.addEventListener('click', (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const actionEl = target.closest<HTMLElement>('[data-action]');
    const action = actionEl?.getAttribute('data-action');
    if (action) {
      handleHeaderAction(action, controls);
    }
  });

  window.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && controls.drawer.classList.contains('drawer--open')) {
      closeDrawer(controls);
    }
  });
}
