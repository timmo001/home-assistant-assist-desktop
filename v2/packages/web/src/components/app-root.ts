import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './assist-chat';
import './settings-page';

type Route = 'home' | 'settings';

@customElement('app-root')
export class AppRoot extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md);
      background-color: var(--color-primary);
      color: white;
      box-shadow: var(--shadow-md);
    }

    .header h1 {
      font-size: var(--font-size-lg);
      margin: 0;
    }

    .nav {
      display: flex;
      gap: var(--spacing-md);
    }

    .nav button {
      color: white;
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-sm);
      transition: background-color var(--transition-fast);
    }

    .nav button:hover {
      background-color: var(--color-primary-dark);
    }

    .nav button.active {
      background-color: var(--color-primary-dark);
      font-weight: 600;
    }

    .content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  `;

  @state()
  private currentRoute: Route = 'home';

  @state()
  private isAuthenticated: boolean = false;

  connectedCallback() {
    super.connectedCallback();
    // Listen for hash changes for routing
    window.addEventListener('hashchange', () => this.handleRouteChange());
    this.handleRouteChange();
  }

  private handleRouteChange() {
    const hash = window.location.hash.slice(1) || 'home';
    this.currentRoute = hash as Route;
  }

  private navigate(route: Route) {
    window.location.hash = route;
  }

  render() {
    return html`
      <div class="header">
        <h1>Home Assistant Assist</h1>
        <nav class="nav">
          <button
            class="${this.currentRoute === 'home' ? 'active' : ''}"
            @click="${() => this.navigate('home')}"
          >
            Chat
          </button>
          <button
            class="${this.currentRoute === 'settings' ? 'active' : ''}"
            @click="${() => this.navigate('settings')}"
          >
            Settings
          </button>
        </nav>
      </div>
      <div class="content">
        ${this.renderRoute()}
      </div>
    `;
  }

  private renderRoute() {
    switch (this.currentRoute) {
      case 'home':
        return html`<assist-chat></assist-chat>`;
      case 'settings':
        return html`<settings-page></settings-page>`;
      default:
        return html`<assist-chat></assist-chat>`;
    }
  }
}
