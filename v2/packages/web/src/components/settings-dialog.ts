import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './settings-page';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';

@customElement('settings-dialog')
export class SettingsDialog extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    wa-dialog::part(panel) {
      max-width: 700px;
      width: 90vw;
      max-height: 90vh;
    }

    wa-dialog::part(title) {
      color: var(--ha-color-text-primary);
    }

    wa-dialog::part(header-actions) {
      color: var(--ha-color-text-primary);
    }

    wa-dialog::part(body) {
      padding: 0;
      overflow: hidden;
    }

    settings-page {
      max-height: calc(90vh - 60px);
    }
  `;

  @property({ type: Boolean })
  open = false;

  private handleClose() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close'));
  }

  private handleSettingsSaved() {
    // Emit event to parent
    this.dispatchEvent(new CustomEvent('settings-saved'));
    
    // Close dialog after a short delay to show success message
    setTimeout(() => {
      this.open = false;
    }, 1500);
  }

  render() {
    return html`
      <wa-dialog
        ?open="${this.open}"
        @wa-request-close="${this.handleClose}"
        label="Settings"
      >
        <settings-page @settings-saved="${this.handleSettingsSaved}"></settings-page>
      </wa-dialog>
    `;
  }
}
