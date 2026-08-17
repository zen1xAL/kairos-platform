import {
  CATALOG_COINS,
  ORBIT_COINS,
  type CryptoCoinConfig,
  type CryptoQuote,
  type OrbitSide,
} from '../types/crypto.types';
import { cryptoWS } from './crypto-ws';

const FLASH_DURATION_MS = 600;

const RING_DESIGN_SIZE = 764;
const RAIL_HEIGHT = 402;
const ARC_RADIUS = 466;
const ARC_HALF_SPREAD = (32 * Math.PI) / 180;
const DESKTOP_LAYOUT_QUERY = '(min-width: 1201px)';

const priceElementsBySymbol: Map<string, HTMLElement[]> = new Map();
let railLeft: HTMLElement | null = null;
let railRight: HTMLElement | null = null;
let wavesBox: HTMLElement | null = null;
let nextAddSide: OrbitSide = 'right';

function formatCurrency(price: number, decimals: number): string {
  const formattedNumber = price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `$${formattedNumber}`;
}

function findCoinBySymbol(symbol: string): CryptoCoinConfig | undefined {
  return ORBIT_COINS.find((coin): boolean => coin.symbol === symbol);
}

function getRail(side: OrbitSide): HTMLElement | null {
  return side === 'left' ? railLeft : railRight;
}

function createCard(coin: CryptoCoinConfig, side: OrbitSide): HTMLElement {
  const card = document.createElement('div');
  card.className = `crypto-orbit__item crypto-orbit__item--${side}`;
  card.dataset.symbol = coin.symbol;
  card.setAttribute('role', 'listitem');

  const price = document.createElement('span');
  price.className = 'crypto-orbit__price';
  price.dataset.role = 'price';
  price.textContent = formatCurrency(coin.defaultPrice, coin.decimals);

  const name = document.createElement('span');
  name.className = 'crypto-orbit__name';
  name.textContent = coin.name;

  const iconWrap = document.createElement('span');
  iconWrap.className = 'crypto-orbit__icon-wrap';
  const icon = document.createElement('img');
  icon.src = coin.icon;
  icon.alt = coin.name;
  icon.className = 'crypto-orbit__icon';
  iconWrap.appendChild(icon);

  const inner = document.createElement('span');
  inner.className = 'crypto-orbit__card-inner';
  for (const node of side === 'left' ? [price, name, iconWrap] : [iconWrap, name, price]) {
    inner.appendChild(node);
  }
  card.appendChild(inner);

  const elements = priceElementsBySymbol.get(coin.symbol) ?? [];
  elements.push(price);
  priceElementsBySymbol.set(coin.symbol, elements);

  return card;
}

function isDesktopLayout(): boolean {
  return window.matchMedia(DESKTOP_LAYOUT_QUERY).matches;
}

function layoutRail(side: OrbitSide, centerX: number, centerY: number, scale: number): void {
  const rail = getRail(side);
  if (!rail) {
    return;
  }
  const cards = [...rail.children] as HTMLElement[];
  const count = cards.length;

  cards.forEach((card, index): void => {
    const t = count > 1 ? index / (count - 1) : 0.5;
    const edgeOffset = ARC_RADIUS * Math.cos(ARC_HALF_SPREAD * (2 * t - 1)) * scale;
    const x =
      side === 'left' ? centerX - edgeOffset - card.offsetWidth : centerX + edgeOffset;
    const y = centerY + (t - 0.5) * RAIL_HEIGHT * scale - card.offsetHeight / 2;
    card.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  });
}

function layoutOrbit(): void {
  if (!wavesBox || !wavesBox.offsetParent) {
    return;
  }
  if (!isDesktopLayout()) {
    for (const side of ['left', 'right'] as const) {
      const rail = getRail(side);
      if (rail) {
        for (const card of [...rail.children] as HTMLElement[]) {
          card.style.transform = '';
        }
      }
    }
    return;
  }

  const containerBox = wavesBox.closest('.crypto-orbit__container');
  if (!containerBox) {
    return;
  }
  const rings = wavesBox.getBoundingClientRect();
  const container = containerBox.getBoundingClientRect();
  const centerX = rings.left + rings.width / 2 - container.left;
  const centerY = rings.top + rings.height / 2 - container.top;
  const scale = rings.width / RING_DESIGN_SIZE;

  layoutRail('left', centerX, centerY, scale);
  layoutRail('right', centerX, centerY, scale);
}

function renderInitialCoins(): void {
  for (const coin of ORBIT_COINS) {
    const rail = getRail(coin.side);
    if (rail) {
      rail.appendChild(createCard(coin, coin.side));
    }
  }
}

function addCoinToOrbit(coin: CryptoCoinConfig): void {
  const side = nextAddSide;
  nextAddSide = side === 'left' ? 'right' : 'left';

  const rail = getRail(side);
  if (!rail) {
    return;
  }

  const card = createCard(coin, side);
  card.classList.add('crypto-orbit__item--preparing');
  rail.appendChild(card);
  layoutOrbit();

  window.requestAnimationFrame((): void => {
    card.classList.remove('crypto-orbit__item--preparing');
    card.classList.add('crypto-orbit__item--entering');
    card.addEventListener(
      'animationend',
      (): void => {
        card.classList.remove('crypto-orbit__item--entering');
      },
      { once: true }
    );
  });
}

function updatePriceElement(element: HTMLElement, quote: CryptoQuote): void {
  const coin = findCoinBySymbol(quote.symbol);
  element.textContent = formatCurrency(quote.price, coin?.decimals ?? 2);

  if (quote.direction === 'neutral') {
    return;
  }

  const flashClass =
    quote.direction === 'up' ? 'crypto-orbit__price--up' : 'crypto-orbit__price--down';

  element.classList.remove('crypto-orbit__price--up', 'crypto-orbit__price--down');
  void element.offsetWidth;
  element.classList.add(flashClass);

  window.setTimeout((): void => {
    element.classList.remove(flashClass);
  }, FLASH_DURATION_MS);
}

function handlePriceQuote(quote: CryptoQuote): void {
  for (const element of priceElementsBySymbol.get(quote.symbol) ?? []) {
    updatePriceElement(element, quote);
  }
}

function createMenuItem(coin: CryptoCoinConfig): HTMLLIElement {
  const item = document.createElement('li');
  item.className = 'crypto-orbit__menu-item';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'crypto-orbit__menu-btn';
  button.dataset.coinId = coin.id;
  button.innerHTML = `
    <img src="${coin.icon}" alt="" class="crypto-orbit__menu-icon" aria-hidden="true">
    <span class="crypto-orbit__menu-name">${coin.name}</span>
  `;
  item.appendChild(button);
  return item;
}

function closeDropdown(dropdown: HTMLElement, trigger: HTMLButtonElement): void {
  const menu = dropdown.querySelector<HTMLElement>('.crypto-orbit__menu');
  if (menu) {
    menu.classList.remove('is-open');
  }
  trigger.setAttribute('aria-expanded', 'false');
}

function initDropdown(): void {
  const dropdown = document.querySelector<HTMLElement>('.crypto-orbit__dropdown');
  const trigger = document.querySelector<HTMLButtonElement>('[data-action="open-add-crypto"]');
  const menuList = dropdown?.querySelector<HTMLElement>('.crypto-orbit__menu-list');

  if (!dropdown || !trigger || !menuList) {
    return;
  }

  for (const coin of CATALOG_COINS) {
    menuList.appendChild(createMenuItem(coin));
  }

  trigger.addEventListener('click', (): void => {
    const menu = dropdown.querySelector<HTMLElement>('.crypto-orbit__menu');
    if (!menu) {
      return;
    }
    const willOpen = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', willOpen);
    trigger.setAttribute('aria-expanded', String(willOpen));
  });

  menuList.addEventListener('click', (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const button = target.closest<HTMLButtonElement>('.crypto-orbit__menu-btn');
    if (!button) {
      return;
    }
    const coin = ORBIT_COINS.find((item): boolean => item.id === button.dataset.coinId);
    if (coin) {
      addCoinToOrbit(coin);
      closeDropdown(dropdown, trigger);
    }
  });

  document.addEventListener('click', (event: MouseEvent): void => {
    if (event.target instanceof Element && !dropdown.contains(event.target)) {
      closeDropdown(dropdown, trigger);
    }
  });

  document.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      closeDropdown(dropdown, trigger);
    }
  });
}

function initDecorations(): void {
  const section = document.querySelector<HTMLElement>('.crypto-orbit');
  if (!section || typeof IntersectionObserver === 'undefined') {
    return;
  }

  for (const path of section.querySelectorAll<SVGPathElement>('.crypto-orbit__decoration-path')) {
    path.style.setProperty('--path-length', `${path.getTotalLength()}`);
  }

  const observer = new IntersectionObserver(
    (entries): void => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-drawn', entry.isIntersecting);
      }
    },
    { threshold: 0.35 }
  );
  observer.observe(section);
}

export function initCryptoOrbit(): void {
  for (const coin of ORBIT_COINS) {
    cryptoWS.registerTrackedCoin(coin.symbol, coin.okxInstrumentId);
    cryptoWS.registerInitialPrice(coin.symbol, coin.defaultPrice);
  }

  railLeft = document.querySelector('.crypto-orbit__rail--left');
  railRight = document.querySelector('.crypto-orbit__rail--right');
  wavesBox = document.querySelector('.crypto-orbit__waves');

  renderInitialCoins();
  layoutOrbit();

  const mediaQuery = window.matchMedia(DESKTOP_LAYOUT_QUERY);
  mediaQuery.addEventListener('change', layoutOrbit);
  window.addEventListener('resize', layoutOrbit);

  cryptoWS.subscribe(handlePriceQuote);
  cryptoWS.connect();
  initDropdown();
  initDecorations();
}
