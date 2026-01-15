import './styles/global.css';
import './components/app-root';
import { ThemeManager } from './lib/theme';

// Initialize theme system
ThemeManager.init();

// Render the app root component
const root = document.getElementById('root');
if (root) {
  root.innerHTML = '<app-root></app-root>';
}
