import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { backendClient } from '../lib/backend-client';
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

    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: var(--spacing-lg);
    }

    .loading-screen .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: var(--spacing-xl);
      text-align: center;
      gap: var(--spacing-lg);
    }

    .error-screen h2 {
      color: var(--color-error);
      margin: 0;
    }

    .error-screen p {
      color: var(--color-text-secondary);
      max-width: 500px;
    }

    .error-screen button {
      padding: var(--spacing-sm) var(--spacing-lg);
      background-color: var(--color-primary);
      color: white;
      border-radius: var(--radius-md);
      font-weight: 600;
    }

    .reconnect-banner {
      background-color: var(--color-error);
      color: white;
      padding: var(--spacing-md);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
    }

    .reconnect-banner button {
      padding: var(--spacing-xs) var(--spacing-md);
      background-color: white;
      color: var(--color-error);
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
  `;

  @state()
  private currentRoute: Route = 'home';

  @state()
  private isLoading: boolean = true;

  @state()
  private isAuthenticated: boolean = false;

  @state()
  private hasSettings: boolean = false;

  @state()
  private error: string | null = null;

  @state()
  private showReconnectBanner: boolean = false;

  async connectedCallback() {
    super.connectedCallback();
    
    // Listen for hash changes for routing
    window.addEventListener('hashchange', () => this.handleRouteChange());
    this.handleRouteChange();

    // Initialize app
    await this.initialize();
  }

  /**
   * Initialize the application
   * 1. Detect password
   * 2. Auto-login
   * 3. Check settings
   * 4. Redirect appropriately
   */
  private async initialize() {
    this.isLoading = true;
    this.error = null;

    try {
      // Step 1: Detect password
      const password = backendClient.detectPassword();
      
      if (!password) {
        this.error = 'No password provided. Please add ?password=YOUR_PASSWORD to the URL.';
        this.isLoading = false;
        return;
      }

      // Step 2: Auto-login
      try {
        const loginResult = await backendClient.login(password);
        
        if (!loginResult.success) {
          this.error = loginResult.error || 'Authentication failed';
          this.isLoading = false;
          return;
        }

        this.isAuthenticated = true;
      } catch (loginError) {
        this.error = `Could not connect to backend: ${loginError instanceof Error ? loginError.message : 'Unknown error'}`;
        this.isLoading = false;
        return;
      }

      // Step 3: Check if HA settings are configured
      try {
        const settingsResult = await backendClient.getSettings();
        this.hasSettings = settingsResult.settings !== null;
      } catch (settingsError) {
        console.error('Failed to check settings:', settingsError);
        this.hasSettings = false;
      }

      // Step 4: Redirect appropriately
      if (!this.hasSettings && this.currentRoute !== 'settings') {
        // First run - redirect to settings
        this.navigate('settings');
      }

      this.isLoading = false;
    } catch (error) {
      console.error('Initialization error:', error);
      this.error = `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.isLoading = false;
    }
  }

  private handleRouteChange() {
    const hash = window.location.hash.slice(1) || 'home';
    this.currentRoute = hash as Route;
  }

  private navigate(route: Route) {
    window.location.hash = route;
  }

  private async handleRetry() {
    this.showReconnectBanner = false;
    await this.initialize();
  }

  private async handleReconnect() {
    this.showReconnectBanner = false;
    
    try {
      // Try to ping the backend
      await backendClient.checkAuthStatus();
      // If successful, the banner will hide
    } catch {
      // Show banner again if still can't connect
      setTimeout(() => {
        this.showReconnectBanner = true;
      }, 1000);
    }
  }

  /**
   * Handle settings saved event - check if we should show home
   */
  private handleSettingsSaved() {
    this.hasSettings = true;
    // Stay on settings page, user can navigate manually
  }

  render() {
    // Show loading screen during initialization
    if (this.isLoading) {
      return html`
        <div class="loading-screen">
          <div class="spinner"></div>
          <p>Connecting to backend...</p>
        </div>
      `;
    }

    // Show error screen if initialization failed
    if (this.error) {
      return html`
        <div class="error-screen">
          <h2>Connection Error</h2>
          <p>${this.error}</p>
          <button @click="${this.handleRetry}">Retry</button>
        </div>
      `;
    }

    // Show main app
    return html`
      ${this.showReconnectBanner
        ? html`
            <div class="reconnect-banner">
              <span>⚠️ Connection to backend lost</span>
              <button @click="${this.handleReconnect}">Reconnect</button>
            </div>
          `
        : ''}
      
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
        if (!this.hasSettings) {
          return html`
            <div class="error-screen">
              <h2>Configuration Required</h2>
              <p>Please configure your Home Assistant connection first.</p>
              <button @click="${() => this.navigate('settings')}">Go to Settings</button>
            </div>
          `;
        }
        return html`<assist-chat></assist-chat>`;
      
      case 'settings':
        return html`<settings-page @settings-saved="${this.handleSettingsSaved}"></settings-page>`;
      
      default:
        return html`<assist-chat></assist-chat>`;
    }
  }
}
