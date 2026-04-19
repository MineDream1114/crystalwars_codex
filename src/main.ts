import './style.css';
import { Game } from './game/Game';

const mount = document.getElementById('app');

if (!mount) {
  throw new Error('Missing app mount node.');
}

new Game(mount);
