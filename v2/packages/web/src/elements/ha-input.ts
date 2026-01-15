import { customElement } from 'lit/decorators.js';
import { css } from 'lit';
import WaInput from '@awesome.me/webawesome/dist/components/input/input.js';

/**
 * Home Assistant themed input component
 * Extends Web Awesome input with HA design tokens
 */
@customElement('ha-input')
export class HaInput extends WaInput {
  static get styles() {
    return [
      ...Array.isArray(super.styles) ? super.styles : [super.styles],
      css`
        :host {
          --wa-form-control-height: 42px;
          --wa-form-control-border-radius: var(--ha-border-radius-md);
          --wa-input-border-color: var(--ha-color-input-border);
          --wa-input-border-color-focus: var(--ha-color-input-border-focus);
          --wa-input-background-color: var(--ha-color-input-background);
          --wa-spacing-medium: var(--ha-space-2) var(--ha-space-4);
          
          /* Shoelace variables (WA uses these internally) */
          --sl-input-border-color: var(--ha-color-input-border);
          --sl-input-border-color-hover: var(--ha-color-input-border);
          --sl-input-border-color-focus: var(--ha-color-input-border-focus);
          --sl-input-background-color: var(--ha-color-input-background);
          --sl-input-height-medium: 42px;
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
    'ha-input': HaInput;
  }
}
