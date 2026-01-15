import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { backendClient } from '../lib/backend-client';
import { ThemeManager } from '../lib/theme';
import '../elements/ha-button';
import '../elements/ha-input';
import '../elements/ha-select';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';

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
      padding: var(--ha-space-8);
    }

    .form-group {
      margin-bottom: var(--ha-space-6);
    }

    .form-group ha-input,
    .form-group ha-select {
      width: 100%;
    }

    .form-group .help-text {
      font-size: var(--ha-font-size-s);
      color: var(--ha-color-text-secondary);
      margin-top: var(--ha-space-1);
      display: block;
    }

    .actions {
      display: flex;
      gap: var(--ha-space-4);
      margin-top: var(--ha-space-8);
      flex-wrap: wrap;
    }

    .status-message {
      margin-top: var(--ha-space-4);
    }

    .section-divider {
      height: 1px;
      background-color: var(--ha-color-border);
      margin: var(--ha-space-8) 0;
    }

    .theme-buttons {
      display: flex;
      gap: var(--ha-space-3);
    }

    .theme-buttons ha-button {
      flex: 1;
    }

    label {
      color: var(--ha-color-text-primary);
    }
  `;

  @state()
  private url: string = '';

  @state()
  private accessToken: string = '';

  @state()
  private selectedPipelineId: string = '';

  @state()
  private pipelines: Array<{ id: string; name: string }> = [];

  @state()
  private isLoading: boolean = false;

  @state()
  private isTesting: boolean = false;

  @state()
  private isLoadingPipelines: boolean = false;

  @state()
  private statusMessage: { type: 'success' | 'danger' | 'primary'; text: string } | null = null;

  @state()
  private currentTheme: 'light' | 'dark' = 'light';

  async connectedCallback() {
    super.connectedCallback();
    this.currentTheme = ThemeManager.getEffectiveTheme();
    await this.loadSettings();
  }

  private async loadSettings() {
    try {
      this.isLoading = true;
      const result = await backendClient.getSettings();
      
      if (result.settings) {
        this.url = result.settings.url || '';
        this.selectedPipelineId = result.settings.selectedPipelineId || '';
        // Access token will be masked from backend (e.g., "test...jkl")
        // Don't populate it - let user re-enter if they want to change
        this.accessToken = '';
        
        // Load pipelines if we have a connection
        if (this.url) {
          await this.loadPipelines();
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Silently fail - settings might not be configured yet
    } finally {
      this.isLoading = false;
    }
  }

  private async loadPipelines() {
    try {
      this.isLoadingPipelines = true;
      const result = await backendClient.getPipelines();
      
      if (result.success && result.pipelines) {
        this.pipelines = result.pipelines.map((p: any) => ({
          id: p.id,
          name: p.name || p.id,
        }));
        
        // Auto-select preferred pipeline if no selection yet
        if (!this.selectedPipelineId && result.preferredPipeline) {
          this.selectedPipelineId = result.preferredPipeline;
        }
        // Or select first pipeline
        else if (!this.selectedPipelineId && this.pipelines.length > 0) {
          this.selectedPipelineId = this.pipelines[0].id;
        }
      }
    } catch (error) {
      console.error('Failed to load pipelines:', error);
      // Silently fail - user can still save without selecting pipeline
    } finally {
      this.isLoadingPipelines = false;
    }
  }

  private handleUrlInput(e: CustomEvent) {
    const input = e.target as any;
    this.url = input.value.trim();
    // Clear status message on input
    this.statusMessage = null;
  }

  private handleTokenInput(e: CustomEvent) {
    const input = e.target as any;
    this.accessToken = input.value.trim();
    // Clear status message on input
    this.statusMessage = null;
  }

  private handlePipelineSelect(e: CustomEvent) {
    const select = e.target as any;
    this.selectedPipelineId = select.value;
    // Clear status message on input
    this.statusMessage = null;
  }

  private handleThemeChange(theme: 'light' | 'dark') {
    ThemeManager.setTheme(theme);
    this.currentTheme = theme;
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
        type: 'danger',
        text: 'Please enter a Home Assistant URL',
      };
      return;
    }

    if (!this.validateUrl(this.url)) {
      this.statusMessage = {
        type: 'danger',
        text: 'Invalid URL format. Must start with http:// or https://',
      };
      return;
    }

    if (!this.accessToken) {
      this.statusMessage = {
        type: 'danger',
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
        
        // Load available pipelines after successful connection
        await this.loadPipelines();
      } else {
        this.statusMessage = {
          type: 'danger',
          text: result.error || 'Connection failed',
        };
      }
    } catch (error) {
      this.statusMessage = {
        type: 'danger',
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
        type: 'danger',
        text: 'Please enter a Home Assistant URL',
      };
      return;
    }

    if (!this.validateUrl(this.url)) {
      this.statusMessage = {
        type: 'danger',
        text: 'Invalid URL format. Must start with http:// or https://',
      };
      return;
    }

    if (!this.accessToken) {
      this.statusMessage = {
        type: 'danger',
        text: 'Please enter an access token',
      };
      return;
    }

    try {
      this.isLoading = true;
      const result = await backendClient.updateSettings({
        url: this.url,
        accessToken: this.accessToken,
        selectedPipelineId: this.selectedPipelineId || undefined,
      });

      if (result.success) {
        this.statusMessage = {
          type: 'success',
          text: 'Settings saved successfully!',
        };

        // Emit event to parent (dialog will close automatically)
        this.dispatchEvent(new CustomEvent('settings-saved'));
      } else {
        this.statusMessage = {
          type: 'danger',
          text: result.error || 'Failed to save settings',
        };
      }
    } catch (error) {
      this.statusMessage = {
        type: 'danger',
        text: `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <div class="container">
        <form @submit="${(e: Event) => e.preventDefault()}">
          <div class="form-group">
            <ha-input
              label="Home Assistant URL"
              type="url"
              placeholder="http://homeassistant.local:8123"
              .value="${this.url}"
              @wa-input="${this.handleUrlInput}"
              ?disabled="${this.isLoading || this.isTesting}"
              required
            >
              <span slot="help-text">
                The full URL of your Home Assistant instance (e.g., http://192.168.1.100:8123)
              </span>
            </ha-input>
          </div>

          <div class="form-group">
            <ha-input
              label="Long-Lived Access Token"
              type="password"
              placeholder="Enter your long-lived access token"
              .value="${this.accessToken}"
              @wa-input="${this.handleTokenInput}"
              ?disabled="${this.isLoading || this.isTesting}"
              required
            >
              <span slot="help-text">
                Create a long-lived access token in Home Assistant: Profile → Security → Long-Lived Access Tokens
              </span>
            </ha-input>
          </div>

          ${this.pipelines.length > 0
            ? html`
                <div class="form-group">
                  <ha-select
                    label="Assist Pipeline"
                    .value="${this.selectedPipelineId}"
                    @wa-change="${this.handlePipelineSelect}"
                    ?disabled="${this.isLoading || this.isTesting || this.isLoadingPipelines}"
                  >
                    ${this.pipelines.map(
                      (pipeline) => html`
                        <wa-option value="${pipeline.id}">
                          ${pipeline.name}
                        </wa-option>
                      `
                    )}
                    <span slot="help-text">
                      ${this.isLoadingPipelines 
                        ? 'Loading pipelines...' 
                        : 'Select which assist pipeline to use for conversations'}
                    </span>
                  </ha-select>
                </div>
              `
            : this.url && !this.isLoadingPipelines
            ? html`
                <div class="form-group">
                  <span class="help-text">
                    Test the connection to load available pipelines
                  </span>
                </div>
              `
            : ''}

          <div class="section-divider"></div>

          <div class="form-group">
            <label style="display: block; margin-bottom: var(--ha-space-3); font-weight: var(--ha-font-weight-medium);">
              Theme
            </label>
            <div class="theme-buttons">
              <ha-button
                variant="${this.currentTheme === 'light' ? 'primary' : 'secondary'}"
                @click="${() => this.handleThemeChange('light')}"
              >
                Light
              </ha-button>
              <ha-button
                variant="${this.currentTheme === 'dark' ? 'primary' : 'secondary'}"
                @click="${() => this.handleThemeChange('dark')}"
              >
                Dark
              </ha-button>
            </div>
            <span class="help-text" style="margin-top: var(--ha-space-2);">
              Choose your preferred color scheme
            </span>
          </div>

          <div class="section-divider"></div>

          <div class="actions">
            <ha-button
              variant="secondary"
              @click="${this.handleTestConnection}"
              ?disabled="${this.isLoading || this.isTesting || !this.url || !this.accessToken}"
            >
              ${this.isTesting 
                ? html`<wa-spinner slot="prefix"></wa-spinner>Testing...` 
                : 'Test Connection'}
            </ha-button>
            
            <ha-button
              variant="primary"
              @click="${this.handleSave}"
              ?disabled="${this.isLoading || this.isTesting || !this.url || !this.accessToken}"
            >
              ${this.isLoading 
                ? html`<wa-spinner slot="prefix"></wa-spinner>Saving...` 
                : 'Save Settings'}
            </ha-button>
          </div>

          ${this.statusMessage
            ? html`
                <wa-callout 
                  variant="${this.statusMessage.type}" 
                  class="status-message animate-slide-in"
                >
                  ${this.statusMessage.text}
                </wa-callout>
              `
            : ''}
        </form>
      </div>
    `;
  }
}
