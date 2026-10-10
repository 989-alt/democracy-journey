import { render } from 'preact';
import { App } from './app';
import './styles/tokens.css';
import './styles/base.css';

function fit() {
  const s = Math.min(window.innerWidth / 1024, window.innerHeight / 768);
  document.documentElement.style.setProperty('--stage-scale', String(s));
}
fit();
window.addEventListener('resize', fit);

render(<App />, document.getElementById('app')!);

if (import.meta.env.DEV || location.search.includes('debug')) {
  void import('./debug');
}
