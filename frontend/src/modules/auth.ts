interface AuthProfile {
  name: string;
  email: string;
  picture: string;
  token: string;
}

const STORAGE_KEY = 'kairos.auth.profile';
const AUTH_HASH_PREFIX = '#auth=';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

function isAuthProfile(value: unknown): value is AuthProfile {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.picture === 'string' &&
    typeof value.token === 'string'
  );
}

function readProfileFromHash(): AuthProfile | null {
  if (!window.location.hash.startsWith(AUTH_HASH_PREFIX)) {
    return null;
  }
  try {
    const rawJson = decodeBase64Url(window.location.hash.slice(AUTH_HASH_PREFIX.length));
    const parsed: unknown = JSON.parse(rawJson);
    return isAuthProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readStoredProfile(): AuthProfile | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isAuthProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function storeProfile(profile: AuthProfile): void {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function clearStoredProfile(): void {
  window.sessionStorage.removeItem(STORAGE_KEY);
}

function createProfileDetails(profile: AuthProfile): HTMLElement {
  const details = document.createElement('div');
  details.className = 'auth-widget__profile-details';

  const name = document.createElement('span');
  name.className = 'auth-widget__profile-name';
  name.textContent = profile.name;

  const email = document.createElement('span');
  email.className = 'auth-widget__profile-email';
  email.textContent = profile.email;

  details.append(name, email);
  return details;
}

function createSignOutButton(): HTMLButtonElement {
  const signOut = document.createElement('button');
  signOut.type = 'button';
  signOut.className = 'auth-widget__create-btn auth-widget__profile-signout';
  signOut.textContent = 'Sign out';
  signOut.addEventListener('click', (): void => {
    clearStoredProfile();
    window.location.reload();
  });
  return signOut;
}

function createProfileCard(profile: AuthProfile): HTMLElement {
  const card = document.createElement('div');
  card.className = 'auth-widget__profile';

  const avatar = document.createElement('img');
  avatar.src = profile.picture;
  avatar.alt = profile.name;
  avatar.className = 'auth-widget__profile-avatar';
  avatar.referrerPolicy = 'no-referrer';

  card.append(avatar, createProfileDetails(profile), createSignOutButton());
  return card;
}

function renderProfile(widget: HTMLElement, profile: AuthProfile): void {
  const body = widget.querySelector('.auth-widget__body');
  if (body) {
    body.replaceChildren(createProfileCard(profile));
  }
}

async function startGoogleAuth(): Promise<void> {
  try {
    const response = await window.fetch('/api/auth/google/url');
    if (!response.ok) {
      return;
    }
    const payload: unknown = await response.json();
    if (isRecord(payload) && typeof payload.url === 'string') {
      window.location.assign(payload.url);
    }
  } catch {
  }
}

export function initAuth(): void {
  const widget = document.querySelector<HTMLElement>('.auth-widget');
  if (!widget) {
    return;
  }

  const profile = readProfileFromHash();
  if (profile) {
    storeProfile(profile);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  const activeProfile = profile ?? readStoredProfile();
  if (activeProfile) {
    renderProfile(widget, activeProfile);
  }

  document.addEventListener('auth:google', (): void => {
    void startGoogleAuth();
  });
}
