import './styles/global.css';
import './components/app-root';

// Render the app root component
const root = document.getElementById('root');
if (root) {
  root.innerHTML = '<app-root></app-root>';
}
