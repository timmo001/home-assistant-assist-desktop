import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { backendClient } from '../lib/backend-client';
import { ThemeManager } from '../lib/theme';
import './assist-chat';
import './settings-page';
import '../elements/ha-button';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';

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

    .content {
      height: 100%;
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
      gap: var(--ha-space-6);
    }

    .loading-screen p {
      font-size: var(--ha-font-size-base);
      color: var(--ha-color-text-secondary);
    }

    .error-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: var(--ha-space-8);
      text-align: center;
      gap: var(--ha-space-6);
    }

    .error-screen h2 {
      color: var(--ha-color-text-danger);
      font-size: var(--ha-font-size-xl);
      font-weight: var(--ha-font-weight-medium);
      margin: 0;
    }

    .error-screen p {
      color: var(--ha-color-text-secondary);
      font-size: var(--ha-font-size-base);
      max-width: 500px;
      margin: 0;
    }

    .reconnect-banner {
      background-color: var(--ha-color-fill-danger-loud);
      color: white;
      padding: var(--ha-space-4);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ha-space-4);
      font-size: var(--ha-font-size-sm);
      font-weight: var(--ha-font-weight-medium);
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
    
    // Initialize theme manager
    ThemeManager.init();
    
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
          <wa-spinner style="font-size: 3rem;"></wa-spinner>
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
          <ha-button variant="primary" @click="${this.handleRetry}">Retry</ha-button>
        </div>
      `;
    }

    // Show main app
    return html`
      ${this.showReconnectBanner
        ? html`
            <div class="reconnect-banner">
              <span>⚠️ Connection to backend lost</span>
              <ha-button variant="secondary" size="small" @click="${this.handleReconnect}">
                Reconnect
              </ha-button>
            </div>
          `
        : ''}
      
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
              <ha-button variant="primary" @click="${() => this.navigate('settings')}">
                Go to Settings
              </ha-button>
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
