interface HeaderElements {
  container: HTMLElement;
  drawer: HTMLElement | null;
  burger: HTMLElement | null;
}

export const initHeader = (): void => {
  const container = document.body;
  const drawer = document.getElementById('mobile-drawer');
  const burger = document.querySelector<HTMLElement>('[data-action="open-menu"]');

  if (!drawer || !burger) {
    return;
  }

  const elements: HeaderElements = {
    container,
    drawer,
    burger
  };

  const openDrawer = (): void => {
    elements.drawer?.classList.add('drawer--open');
    elements.drawer?.setAttribute('aria-hidden', 'false');
    elements.burger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = (): void => {
    elements.drawer?.classList.remove('drawer--open');
    elements.drawer?.setAttribute('aria-hidden', 'true');
    elements.burger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  elements.container.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const actionEl = target.closest<HTMLElement>('[data-action]');
    if (!actionEl) {
      return;
    }

    const action = actionEl.getAttribute('data-action');
    if (action === 'open-menu') {
      openDrawer();
    } else if (action === 'close-menu' || action === 'nav-link') {
      closeDrawer();
    }
  });

  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && elements.drawer?.classList.contains('drawer--open')) {
      closeDrawer();
    }
  });
};
