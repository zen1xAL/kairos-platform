type AuthTab = 'personal' | 'business';

function isAuthTab(value: unknown): value is AuthTab {
  return value === 'personal' || value === 'business';
}

function setActiveTab(container: HTMLElement, activeTab: AuthTab): void {
  container.dataset.activeTab = activeTab;
  const tabs = container.querySelectorAll<HTMLButtonElement>('.auth-widget__tab');

  tabs.forEach((tab: HTMLButtonElement): void => {
    const isActive = tab.dataset.tab === activeTab;
    tab.classList.toggle('auth-widget__tab--active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
}

function handleTabClick(widget: HTMLElement, target: HTMLElement): boolean {
  const tab = target.closest<HTMLButtonElement>('.auth-widget__tab');
  if (!tab) {
    return false;
  }
  const tabId = tab.dataset.tab;
  if (isAuthTab(tabId)) {
    setActiveTab(widget, tabId);
  }
  return true;
}

function handleActionClick(target: HTMLElement): void {
  if (target.closest('.auth-widget__google-btn')) {
    document.dispatchEvent(new CustomEvent('auth:google'));
    return;
  }
  if (target.closest('.auth-widget__email-btn')) {
    document.dispatchEvent(new CustomEvent('auth:email'));
    return;
  }
  if (target.closest('.auth-widget__create-btn')) {
    document.dispatchEvent(new CustomEvent('auth:create-account'));
  }
}

export function initAuthWidget(): void {
  const widget = document.querySelector<HTMLElement>('.auth-widget');
  if (!widget) {
    return;
  }

  setActiveTab(widget, 'personal');

  widget.addEventListener('click', (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (handleTabClick(widget, target)) {
      return;
    }
    handleActionClick(target);
  });
}
