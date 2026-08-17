import './styles/main.css';
import { initHeader } from './modules/header';
import { initHero } from './modules/hero';
import { initAuthWidget } from './modules/auth-widget';
import { initAuth } from './modules/auth';
import { initModals } from './modules/modals';
import { initCryptoOrbit } from './modules/crypto-orbit';

document.addEventListener('DOMContentLoaded', (): void => {
  initHeader();
  initHero();
  initAuthWidget();
  initAuth();
  initModals();
  initCryptoOrbit();
});
