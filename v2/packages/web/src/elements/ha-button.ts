import { customElement, property } from 'lit/decorators.js';
import { css } from 'lit';
import WaButton from '@awesome.me/webawesome/dist/components/button/button.js';

/**
 * Home Assistant themed button component
 * Extends Web Awesome button with HA design tokens
 */
@customElement('ha-button')
export class HaButton extends WaButton {
  @property({ reflect: true }) variant: 'primary' | 'secondary' | 'danger' | 'text' = 'primary';
  
  static get styles() {
    return [
      ...Array.isArray(super.styles) ? super.styles : [super.styles],
      css`
        :host {
          --wa-form-control-height: 40px;
          --wa-form-control-border-radius: var(--ha-border-radius-md);
          --wa-font-weight-action: var(--ha-font-weight-medium);
          --wa-spacing-medium: var(--ha-space-2) var(--ha-space-4);
        }
        
        /* Primary variant (default) */
        :host([variant="primary"]) {
          --wa-color-primary: var(--ha-color-fill-primary-loud);
        }
        
        :host([variant="primary"]:not([appearance])) {
          --sl-color-primary-600: var(--ha-color-fill-primary-loud);
          --sl-color-primary-700: var(--ha-color-fill-primary-loud-hover);
        }
        
        /* Secondary variant */
        :host([variant="secondary"]) {
          --sl-color-neutral-600: var(--ha-color-fill-neutral-loud);
        }
        
        /* Danger variant */
        :host([variant="danger"]) {
          --sl-color-danger-600: var(--ha-color-fill-danger);
          --sl-color-danger-700: var(--ha-color-fill-danger);
        }
        
        /* Text variant */
        :host([variant="text"]) ::slotted(*) {
          color: var(--ha-color-text-primary);
        }
      `
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ha-button': HaButton;
  }
}
