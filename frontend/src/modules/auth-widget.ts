type AuthTab = 'sign-in' | 'enter-email';

function setActiveTab(container: HTMLElement, activeTab: AuthTab): void {
  container.dataset.activeTab = activeTab;
  const tabs = container.querySelectorAll<HTMLButtonElement>('.auth-widget__tab');

  tabs.forEach((tab: HTMLButtonElement): void => {
    const isActive = tab.dataset.tab === activeTab;
    tab.classList.toggle('auth-widget__tab--active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
}

export function initAuthWidget(): void {
  const widget = document.querySelector<HTMLElement>('.auth-widget');
  if (!widget) {
    return;
  }

  setActiveTab(widget, 'sign-in');

  widget.addEventListener('click', (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const tab = target.closest<HTMLButtonElement>('.auth-widget__tab');
    if (tab) {
      const tabId = tab.dataset.tab as AuthTab | undefined;
      if (tabId) {
        setActiveTab(widget, tabId);
      }
      return;
    }

    const googleBtn = target.closest<HTMLButtonElement>('.auth-widget__google-btn');
    if (googleBtn) {
      document.dispatchEvent(new CustomEvent('auth:google'));
      return;
    }

    const createBtn = target.closest<HTMLButtonElement>('.auth-widget__create-btn');
    if (createBtn) {
      document.dispatchEvent(new CustomEvent('auth:create-account'));
    }
  });
}
