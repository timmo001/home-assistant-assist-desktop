import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { backendClient } from '../lib/backend-client';

@customElement('settings-page')
export class SettingsPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: var(--spacing-xl);
    }

    .header {
      margin-bottom: var(--spacing-xl);
    }

    .header h2 {
      font-size: var(--font-size-xl);
      margin-bottom: var(--spacing-sm);
    }

    .header p {
      color: var(--color-text-secondary);
    }

    .form-group {
      margin-bottom: var(--spacing-lg);
    }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: var(--spacing-sm);
    }

    .form-group input {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background-color: var(--color-background);
      font-size: var(--font-size-base);
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .form-group input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-group .help-text {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-top: var(--spacing-xs);
    }

    .actions {
      display: flex;
      gap: var(--spacing-md);
      margin-top: var(--spacing-xl);
      flex-wrap: wrap;
    }

    .button {
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-md);
      font-weight: 600;
      transition: all var(--transition-fast);
      cursor: pointer;
    }

    .button.primary {
      background-color: var(--color-primary);
      color: white;
    }

    .button.primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }

    .button.secondary {
      background-color: transparent;
      color: var(--color-primary);
      border: 1px solid var(--color-primary);
    }

    .button.secondary:hover:not(:disabled) {
      background-color: var(--color-primary);
      color: white;
    }

    .button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .status-message {
      padding: var(--spacing-md);
      border-radius: var(--radius-sm);
      margin-top: var(--spacing-md);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .status-message.success {
      background-color: #10b981;
      color: white;
    }

    .status-message.error {
      background-color: #ef4444;
      color: white;
    }

    .status-message.info {
      background-color: #3b82f6;
      color: white;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: var(--spacing-sm);
      vertical-align: middle;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  @state()
  private url: string = '';

  @state()
  private accessToken: string = '';

  @state()
  private isLoading: boolean = false;

  @state()
  private isTesting: boolean = false;

  @state()
  private statusMessage: { type: 'success' | 'error' | 'info'; text: string } | null = null;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadSettings();
  }

  private async loadSettings() {
    try {
      this.isLoading = true;
      const result = await backendClient.getSettings();
      
      if (result.settings) {
        this.url = result.settings.url || '';
        // Access token will be masked from backend (e.g., "test...jkl")
        // Don't populate it - let user re-enter if they want to change
        this.accessToken = '';
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Silently fail - settings might not be configured yet
    } finally {
      this.isLoading = false;
    }
  }

  private handleUrlInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.url = input.value.trim();
    // Clear status message on input
    this.statusMessage = null;
  }

  private handleTokenInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.accessToken = input.value.trim();
    // Clear status message on input
    this.statusMessage = null;
  }

  private validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Must be HTTP or HTTPS
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private async handleTestConnection() {
    this.statusMessage = null;

    // Validation
    if (!this.url) {
      this.statusMessage = {
        type: 'error',
        text: 'Please enter a Home Assistant URL',
      };
      return;
    }

    if (!this.validateUrl(this.url)) {
      this.statusMessage = {
        type: 'error',
        text: 'Invalid URL format. Must start with http:// or https://',
      };
      return;
    }

    if (!this.accessToken) {
      this.statusMessage = {
        type: 'error',
        text: 'Please enter an access token',
      };
      return;
    }

    try {
      this.isTesting = true;
      const result = await backendClient.testConnection(this.url, this.accessToken);

      if (result.success) {
        this.statusMessage = {
          type: 'success',
          text: result.message || 'Connection successful!',
        };
      } else {
        this.statusMessage = {
          type: 'error',
          text: result.error || 'Connection failed',
        };
      }
    } catch (error) {
      this.statusMessage = {
        type: 'error',
        text: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    } finally {
      this.isTesting = false;
    }
  }

  private async handleSave() {
    this.statusMessage = null;

    // Validation
    if (!this.url) {
      this.statusMessage = {
        type: 'error',
        text: 'Please enter a Home Assistant URL',
      };
      return;
    }

    if (!this.validateUrl(this.url)) {
      this.statusMessage = {
        type: 'error',
        text: 'Invalid URL format. Must start with http:// or https://',
      };
      return;
    }

    if (!this.accessToken) {
      this.statusMessage = {
        type: 'error',
        text: 'Please enter an access token',
      };
      return;
    }

    try {
      this.isLoading = true;
      const result = await backendClient.updateSettings({
        url: this.url,
        accessToken: this.accessToken,
      });

      if (result.success) {
        this.statusMessage = {
          type: 'success',
          text: 'Settings saved successfully! You can now use the chat.',
        };

        // Emit event to parent
        this.dispatchEvent(new CustomEvent('settings-saved'));

        // Redirect to chat after 2 seconds
        setTimeout(() => {
          window.location.hash = 'home';
        }, 2000);
      } else {
        this.statusMessage = {
          type: 'error',
          text: result.error || 'Failed to save settings',
        };
      }
    } catch (error) {
      this.statusMessage = {
        type: 'error',
        text: `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <div class="container">
        <div class="header">
          <h2>Settings</h2>
          <p>Configure your Home Assistant connection</p>
        </div>

        <form @submit="${(e: Event) => e.preventDefault()}">
          <div class="form-group">
            <label for="ha-url">Home Assistant URL *</label>
            <input
              id="ha-url"
              type="url"
              placeholder="http://homeassistant.local:8123"
              .value="${this.url}"
              @input="${this.handleUrlInput}"
              ?disabled="${this.isLoading || this.isTesting}"
              required
            />
            <div class="help-text">
              The full URL of your Home Assistant instance (e.g., http://192.168.1.100:8123)
            </div>
          </div>

          <div class="form-group">
            <label for="access-token">Long-Lived Access Token *</label>
            <input
              id="access-token"
              type="password"
              placeholder="Enter your long-lived access token"
              .value="${this.accessToken}"
              @input="${this.handleTokenInput}"
              ?disabled="${this.isLoading || this.isTesting}"
              required
            />
            <div class="help-text">
              Create a long-lived access token in Home Assistant: Profile → Security → Long-Lived Access Tokens
            </div>
          </div>

          <div class="actions">
            <button
              class="button secondary"
              type="button"
              @click="${this.handleTestConnection}"
              ?disabled="${this.isLoading || this.isTesting || !this.url || !this.accessToken}"
            >
              ${this.isTesting ? html`<span class="spinner"></span>Testing...` : 'Test Connection'}
            </button>
            
            <button
              class="button primary"
              type="button"
              @click="${this.handleSave}"
              ?disabled="${this.isLoading || this.isTesting || !this.url || !this.accessToken}"
            >
              ${this.isLoading ? html`<span class="spinner"></span>Saving...` : 'Save Settings'}
            </button>
          </div>

          ${this.statusMessage
            ? html`
                <div class="status-message ${this.statusMessage.type}">
                  ${this.statusMessage.text}
                </div>
              `
            : ''}
        </form>
      </div>
    `;
  }
}
