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
      max-width: 70%;
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      word-wrap: break-word;
      box-shadow: var(--shadow-sm);
    }

    .message.user {
      align-self: flex-end;
      background-color: var(--color-primary);
      color: white;
      margin-left: auto;
    }

    .message.assistant {
      align-self: flex-start;
      background-color: var(--color-surface);
      color: var(--color-text);
    }

    .message.error {
      align-self: center;
      background-color: var(--color-error);
      color: white;
      max-width: 90%;
    }

    .message-content {
      margin: 0;
      line-height: 1.5;
    }

    .message-timestamp {
      font-size: var(--font-size-sm);
      opacity: 0.7;
      margin-top: var(--spacing-xs);
      text-align: right;
    }
  `;

  @property({ type: Object })
  message!: Message;

  private formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], {
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
        <div class="message-content">
          ${this.message.content}
        </div>
        <div class="message-timestamp">
          ${this.formatTimestamp(this.message.timestamp)}
        </div>
      </div>
    `;
  }
}

// TODO: Add markdown rendering using the 'marked' library
// TODO: Add syntax highlighting for code blocks
// TODO: Add support for streaming responses
