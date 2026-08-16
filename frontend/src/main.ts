import './styles/main.css';
import { initHeader } from './modules/header';
import { initHero } from './modules/hero';
import { initAuthWidget } from './modules/auth-widget';

document.addEventListener('DOMContentLoaded', (): void => {
  initHeader();
  initHero();
  initAuthWidget();
});
