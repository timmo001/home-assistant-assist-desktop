import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './message-bubble';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

@customElement('assist-chat')
export class AssistChat extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .input-container {
      display: flex;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background-color: var(--color-surface);
      border-top: 1px solid var(--color-border);
    }

    .input-field {
      flex: 1;
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background-color: var(--color-background);
      font-size: var(--font-size-base);
    }

    .input-field:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .send-button {
      padding: var(--spacing-sm) var(--spacing-lg);
      background-color: var(--color-primary);
      color: white;
      border-radius: var(--radius-md);
      font-weight: 600;
      transition: background-color var(--transition-fast);
    }

    .send-button:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .recording-indicator {
      color: var(--color-error);
      font-weight: 600;
      padding: var(--spacing-sm);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--color-text-secondary);
      text-align: center;
      padding: var(--spacing-xl);
    }

    .empty-state h2 {
      margin-bottom: var(--spacing-md);
      color: var(--color-text);
    }
  `;

  @state()
  private messages: Message[] = [];

  @state()
  private inputValue: string = '';

  @state()
  private isRecording: boolean = false;

  @state()
  private isLoading: boolean = false;

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.inputValue = input.value;
  }

  private handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  private async sendMessage() {
    if (!this.inputValue.trim() || this.isLoading) {
      return;
    }

    const messageContent = this.inputValue.trim();
    this.inputValue = '';

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    this.messages = [...this.messages, userMessage];

    // TODO: Implement actual API call to backend
    this.isLoading = true;

    // Placeholder response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a placeholder response. Backend integration coming soon.',
        timestamp: new Date(),
      };

      this.messages = [...this.messages, assistantMessage];
      this.isLoading = false;
    }, 1000);
  }

  render() {
    return html`
      <div class="messages">
        ${this.messages.length === 0
          ? html`
              <div class="empty-state">
                <h2>Welcome to Home Assistant Assist</h2>
                <p>Start a conversation by typing a message below.</p>
              </div>
            `
          : this.messages.map(
              (message) => html`
                <message-bubble .message="${message}"></message-bubble>
              `
            )}
      </div>

      <div class="input-container">
        ${this.isRecording
          ? html`<span class="recording-indicator">Recording...</span>`
          : ''}
        <input
          class="input-field"
          type="text"
          placeholder="Type your message..."
          .value="${this.inputValue}"
          @input="${this.handleInput}"
          @keypress="${this.handleKeyPress}"
          ?disabled="${this.isLoading}"
        />
        <button
          class="send-button"
          @click="${this.sendMessage}"
          ?disabled="${this.isLoading || !this.inputValue.trim()}"
        >
          Send
        </button>
      </div>
    `;
  }
}
