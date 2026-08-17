interface AuthProfile {
  name: string;
  email: string;
  picture: string;
  token: string;
}

const STORAGE_KEY = 'kairos.auth.profile';
const AUTH_HASH_PREFIX = '#auth=';

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

function isAuthProfile(value: unknown): value is AuthProfile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === 'string' &&
    typeof record.email === 'string' &&
    typeof record.picture === 'string' &&
    typeof record.token === 'string'
  );
}

function readProfileFromHash(): AuthProfile | null {
  if (!window.location.hash.startsWith(AUTH_HASH_PREFIX)) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(window.location.hash.slice(AUTH_HASH_PREFIX.length)));
    if (isAuthProfile(parsed)) {
      return parsed;
    }
  } catch {
    console.warn('Ignoring malformed auth payload in URL');
  }
  return null;
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

function createProfileCard(profile: AuthProfile): HTMLElement {
  const card = document.createElement('div');
  card.className = 'auth-widget__profile';

  const avatar = document.createElement('img');
  avatar.src = profile.picture;
  avatar.alt = profile.name;
  avatar.className = 'auth-widget__profile-avatar';
  avatar.referrerPolicy = 'no-referrer';

  const details = document.createElement('div');
  details.className = 'auth-widget__profile-details';

  const name = document.createElement('span');
  name.className = 'auth-widget__profile-name';
  name.textContent = profile.name;

  const email = document.createElement('span');
  email.className = 'auth-widget__profile-email';
  email.textContent = profile.email;

  details.append(name, email);

  const signOut = document.createElement('button');
  signOut.type = 'button';
  signOut.className = 'auth-widget__create-btn auth-widget__profile-signout';
  signOut.textContent = 'Sign out';
  signOut.addEventListener('click', (): void => {
    clearStoredProfile();
    window.location.reload();
  });

  card.append(avatar, details, signOut);
  return card;
}

function renderProfile(widget: HTMLElement, profile: AuthProfile): void {
  const body = widget.querySelector('.auth-widget__body');
  if (!body) {
    return;
  }
  body.replaceChildren(createProfileCard(profile));
}

async function startGoogleAuth(): Promise<void> {
  try {
    const response = await window.fetch('/api/auth/google/url');
    if (!response.ok) {
      throw new Error(`Auth endpoint returned ${response.status}`);
    }
    const payload: unknown = await response.json();
    const record = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
    const url = record.url;
    if (typeof url !== 'string') {
      throw new Error('Auth endpoint response is missing url');
    }
    window.location.assign(url);
  } catch (error) {
    console.warn('Google authorization failed to start:', error);
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
