import { customElement } from 'lit/decorators.js';
import { css } from 'lit';
import WaTextarea from '@awesome.me/webawesome/dist/components/textarea/textarea.js';

/**
 * Home Assistant themed textarea component
 * Extends Web Awesome textarea with HA design tokens
 */
@customElement('ha-textarea')
export class HaTextarea extends WaTextarea {
  static get styles() {
    return [
      ...Array.isArray(super.styles) ? super.styles : [super.styles],
      css`
        :host {
          --wa-form-control-border-radius: var(--ha-border-radius-md);
          --wa-input-border-color: var(--ha-color-input-border);
          --wa-input-border-color-focus: var(--ha-color-input-border-focus);
          --wa-input-background-color: var(--ha-color-input-background);
          --wa-spacing-medium: var(--ha-space-2) var(--ha-space-4);
          
          /* Shoelace variables */
          --sl-input-border-color: var(--ha-color-input-border);
          --sl-input-border-color-hover: var(--ha-color-input-border);
          --sl-input-border-color-focus: var(--ha-color-input-border-focus);
          --sl-input-background-color: var(--ha-color-input-background);
          --sl-input-border-radius-medium: var(--ha-border-radius-md);
          --sl-spacing-medium: var(--ha-space-2) var(--ha-space-4);
          --sl-input-font-size-medium: var(--ha-font-size-m);
        }
        
        /* Focus styles */
        :host([focused]) {
          --sl-input-border-color: var(--ha-color-input-border-focus);
        }
      `
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ha-textarea': HaTextarea;
  }
}
