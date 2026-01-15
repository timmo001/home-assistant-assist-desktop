import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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
      max-width: 80%;
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

    .bubble {
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-md);
      word-wrap: break-word;
      white-space: pre-wrap;
      line-height: 1.5;
    }

    .message.user .bubble {
      background-color: var(--color-primary);
      color: white;
      border-bottom-right-radius: var(--radius-xs);
    }

    .message.assistant .bubble {
      background-color: var(--color-surface);
      color: var(--color-text);
      border-bottom-left-radius: var(--radius-xs);
      border: 1px solid var(--color-border);
    }

    .message.error .bubble {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
      text-align: center;
      font-size: var(--font-size-sm);
    }

    .timestamp {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      margin-top: var(--spacing-xs);
      padding: 0 var(--spacing-xs);
    }

    .role-label {
      font-size: var(--font-size-xs);
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-xs);
      padding: 0 var(--spacing-xs);
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

    return html`
      <div class="message ${this.message.role}">
        ${this.message.role === 'assistant'
          ? html`<div class="role-label">Assistant</div>`
          : ''}
        ${this.message.role === 'error'
          ? html`<div class="role-label">Error</div>`
          : ''}
        
        <div class="bubble">
          ${this.message.content}
        </div>
        
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
