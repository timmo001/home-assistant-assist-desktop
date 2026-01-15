import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

@customElement('message-bubble')
export class MessageBubble extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .message {
      display: flex;
      flex-direction: column;
      max-width: 100%;
    }

    .message.user {
      align-self: flex-end;
      align-items: flex-end;
    }

    .message.assistant {
      align-self: flex-start;
      align-items: flex-start;
    }

    .message.error {
      align-self: center;
      align-items: center;
      max-width: 90%;
    }

    wa-card {
      word-wrap: break-word;
      white-space: pre-wrap;
      line-height: 1.5;
    }

    wa-card::part(base) {
      padding: 0;
    }

    wa-card::part(body) {
      padding: var(--ha-space-2);
    }

    .message.user wa-card {
      background-color: var(--ha-color-fill-primary-loud);
      color: white;
      border-bottom-right-radius: var(--ha-border-radius-xs);
    }

    .message.user wa-card::part(base) {
      background-color: var(--ha-color-fill-primary-loud);
      color: white;
      border: none;
    }

    .message.assistant wa-card {
      border-bottom-left-radius: var(--ha-border-radius-xs);
    }

    .message.assistant wa-card::part(base) {
      background-color: var(--ha-color-surface);
      border: 1px solid var(--ha-color-border);
    }

    wa-callout {
      text-align: center;
      font-size: var(--ha-font-size-sm);
    }

    .timestamp {
      font-size: var(--ha-font-size-xs);
      color: var(--ha-color-text-secondary);
      margin-top: var(--ha-space-2);
      padding: 0 var(--ha-space-2);
    }

    .role-label {
      font-size: var(--ha-font-size-xs);
      font-weight: var(--ha-font-weight-semibold);
      color: var(--ha-color-text-secondary);
      margin-bottom: var(--ha-space-2);
      padding: 0 var(--ha-space-2);
    }
  `;

  @property({ type: Object })
  message!: Message;

  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    // More than 24 hours - show date and time
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  render() {
    if (!this.message) {
      return html``;
    }

    // Error messages use wa-callout
    if (this.message.role === 'error') {
      return html`
        <div class="message error">
          <wa-callout variant="danger">
            <strong>Error</strong>
            <div>${this.message.content}</div>
          </wa-callout>
          <div class="timestamp">
            ${this.formatTimestamp(this.message.timestamp)}
          </div>
        </div>
      `;
    }

    // User and assistant messages use wa-card
    return html`
      <div class="message ${this.message.role}">
        ${this.message.role === 'assistant'
          ? html`<div class="role-label">Assistant</div>`
          : ''}
        
        <wa-card>
          ${this.message.content}
        </wa-card>
        
        <div class="timestamp">
          ${this.formatTimestamp(this.message.timestamp)}
        </div>
      </div>
    `;
  }
}

// TODO: Add markdown rendering using the 'marked' library
// TODO: Add syntax highlighting for code blocks
// TODO: Add support for streaming responses
