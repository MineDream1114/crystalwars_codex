import './style.css';
import { Game } from './game/Game';

const mount = document.getElementById('app');

if (!mount) {
  throw new Error('Missing app mount node.');
}

const touchDevice =
  window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

const syncViewportHeight = (): void => {
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  document.documentElement.style.setProperty(
    '--app-height',
    `${Math.round(viewportHeight)}px`
  );
  document.body.classList.toggle('is-portrait', viewportHeight > viewportWidth);
};

document.documentElement.classList.toggle('touch-device', touchDevice);
document.body.classList.toggle('touch-device', touchDevice);
syncViewportHeight();

window.addEventListener('resize', syncViewportHeight, { passive: true });
window.addEventListener('orientationchange', syncViewportHeight, { passive: true });
window.visualViewport?.addEventListener('resize', syncViewportHeight, { passive: true });
window.visualViewport?.addEventListener('scroll', syncViewportHeight, { passive: true });
document.addEventListener('visibilitychange', syncViewportHeight);

new Game(mount);
