import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { backendClient } from '../lib/backend-client';
import { ThemeManager } from '../lib/theme';
import './assist-chat';
import './settings-dialog';
import '../elements/ha-button';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';

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
  private isLoading: boolean = true;

  @state()
  private isAuthenticated: boolean = false;

  @state()
  private hasSettings: boolean = false;

  @state()
  private error: string | null = null;

  @state()
  private showReconnectBanner: boolean = false;

  @state()
  private showSettingsDialog: boolean = false;

  async connectedCallback() {
    super.connectedCallback();
    
    // Initialize theme manager
    ThemeManager.init();

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

      // Step 4: Show settings dialog if not configured
      if (!this.hasSettings) {
        // First run - show settings dialog
        this.showSettingsDialog = true;
      }

      this.isLoading = false;
    } catch (error) {
      console.error('Initialization error:', error);
      this.error = `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.isLoading = false;
    }
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
   * Handle settings saved event
   */
  private handleSettingsSaved() {
    this.hasSettings = true;
  }

  /**
   * Handle opening settings dialog
   */
  private handleOpenSettings() {
    this.showSettingsDialog = true;
  }

  /**
   * Handle closing settings dialog
   */
  private handleCloseSettings() {
    this.showSettingsDialog = false;
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
        ${!this.hasSettings
          ? html`
              <div class="error-screen">
                <h2>Configuration Required</h2>
                <p>Please configure your Home Assistant connection first.</p>
                <ha-button variant="primary" @click="${this.handleOpenSettings}">
                  Open Settings
                </ha-button>
              </div>
            `
          : html`<assist-chat @open-settings="${this.handleOpenSettings}"></assist-chat>`}
      </div>

      <settings-dialog
        ?open="${this.showSettingsDialog}"
        @close="${this.handleCloseSettings}"
        @settings-saved="${this.handleSettingsSaved}"
      ></settings-dialog>
    `;
  }
}
