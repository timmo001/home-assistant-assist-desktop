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
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--color-primary);
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
    }

    .button {
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-md);
      font-weight: 600;
      transition: all var(--transition-fast);
    }

    .button.primary {
      background-color: var(--color-primary);
      color: white;
    }

    .button.primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }

    .button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .status-message {
      padding: var(--spacing-md);
      border-radius: var(--radius-sm);
      margin-top: var(--spacing-md);
    }

    .status-message.success {
      background-color: var(--color-success);
      color: white;
    }

    .status-message.error {
      background-color: var(--color-error);
      color: white;
    }
  `;

  @state()
  private homeAssistantUrl: string = '';

  @state()
  private accessToken: string = '';

  @state()
  private isLoading: boolean = false;

  @state()
  private statusMessage: { type: 'success' | 'error'; text: string } | null = null;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadSettings();
  }

  private async loadSettings() {
    try {
      this.isLoading = true;
      const settings = await backendClient.getSettings();
      this.homeAssistantUrl = settings.homeAssistantUrl || '';
      this.accessToken = settings.accessToken || '';
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Silently fail - settings might not be configured yet
    } finally {
      this.isLoading = false;
    }
  }

  private handleUrlInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.homeAssistantUrl = input.value;
  }

  private handleTokenInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.accessToken = input.value;
  }

  private async handleSave() {
    this.statusMessage = null;

    if (!this.homeAssistantUrl || !this.accessToken) {
      this.statusMessage = {
        type: 'error',
        text: 'Please fill in all required fields.',
      };
      return;
    }

    try {
      this.isLoading = true;
      await backendClient.updateSettings({
        homeAssistantUrl: this.homeAssistantUrl,
        accessToken: this.accessToken,
      });

      this.statusMessage = {
        type: 'success',
        text: 'Settings saved successfully!',
      };
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
            <label for="ha-url">Home Assistant URL</label>
            <input
              id="ha-url"
              type="url"
              placeholder="http://homeassistant.local:8123"
              .value="${this.homeAssistantUrl}"
              @input="${this.handleUrlInput}"
              ?disabled="${this.isLoading}"
              required
            />
            <div class="help-text">
              The URL of your Home Assistant instance
            </div>
          </div>

          <div class="form-group">
            <label for="access-token">Access Token</label>
            <input
              id="access-token"
              type="password"
              placeholder="Enter your long-lived access token"
              .value="${this.accessToken}"
              @input="${this.handleTokenInput}"
              ?disabled="${this.isLoading}"
              required
            />
            <div class="help-text">
              Create a long-lived access token in Home Assistant under Profile
            </div>
          </div>

          <div class="actions">
            <button
              class="button primary"
              @click="${this.handleSave}"
              ?disabled="${this.isLoading}"
            >
              ${this.isLoading ? 'Saving...' : 'Save Settings'}
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

// TODO: Add connection test button
// TODO: Add more configuration options (pipeline selection, voice settings, etc.)
// TODO: Add validation for URL format
// TODO: Add support for discovering Home Assistant instances on the network
