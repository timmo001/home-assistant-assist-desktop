import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { backendClient } from '../lib/backend-client';
import { storage, type StoredMessage } from '../lib/storage';
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

    .messages::-webkit-scrollbar {
      width: 8px;
    }

    .messages::-webkit-scrollbar-track {
      background: var(--color-background);
    }

    .messages::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: var(--radius-sm);
    }

    .input-container {
      display: flex;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background-color: var(--color-surface);
      border-top: 1px solid var(--color-border);
      align-items: flex-end;
    }

    .input-field {
      flex: 1;
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background-color: var(--color-background);
      font-size: var(--font-size-base);
      font-family: inherit;
      resize: vertical;
      min-height: 42px;
      max-height: 150px;
    }

    .input-field:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .input-field:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .button {
      padding: var(--spacing-sm) var(--spacing-lg);
      background-color: var(--color-primary);
      color: white;
      border-radius: var(--radius-md);
      font-weight: 600;
      transition: background-color var(--transition-fast);
      cursor: pointer;
      white-space: nowrap;
    }

    .button:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }

    .button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .button.secondary {
      background-color: transparent;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: var(--font-size-sm);
    }

    .button.secondary:hover:not(:disabled) {
      background-color: var(--color-surface);
      color: var(--color-text);
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
      gap: var(--spacing-md);
    }

    .empty-state h2 {
      margin: 0;
      color: var(--color-text);
    }

    .empty-state p {
      margin: 0;
      max-width: 400px;
    }

    .thinking-indicator {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background-color: var(--color-surface);
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }

    .actions-bar-left {
      display: flex;
      gap: var(--spacing-sm);
    }
  `;

  @state()
  private messages: Message[] = [];

  @state()
  private inputValue: string = '';

  @state()
  private isLoading: boolean = false;

  @state()
  private conversationId: string | null = null;

  @query('.messages')
  private messagesContainer!: HTMLElement;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadHistory();
  }

  /**
   * Load conversation history from localStorage
   */
  private async loadHistory() {
    const stored = storage.getConversation();
    
    this.conversationId = stored.conversationId;
    this.messages = stored.messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));

    // Wait for next frame to ensure DOM is updated
    await this.updateComplete;
    this.scrollToBottom();
  }

  /**
   * Save conversation history to localStorage
   */
  private saveHistory() {
    const storedMessages: StoredMessage[] = this.messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    }));

    storage.setConversation({
      conversationId: this.conversationId,
      messages: storedMessages,
    });
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private handleInput(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.inputValue = textarea.value;
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
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    this.messages = [...this.messages, userMessage];
    this.saveHistory();
    await this.updateComplete;
    this.scrollToBottom();

    // Execute pipeline
    this.isLoading = true;

    try {
      const result = await backendClient.runPipeline({
        text: messageContent,
        conversationId: this.conversationId,
      });

      if (result.success) {
        // Add assistant response
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.response || 'No response received',
          timestamp: new Date(),
        };

        this.messages = [...this.messages, assistantMessage];

        // Update conversation ID for follow-up questions
        // Note: HA doesn't return conversationId in response, but we keep the same one
        // for the conversation context
        if (!this.conversationId) {
          this.conversationId = crypto.randomUUID();
        }

        this.saveHistory();
      } else {
        // Add error message
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'error',
          content: result.error || 'Pipeline execution failed',
          timestamp: new Date(),
        };

        this.messages = [...this.messages, errorMessage];
        this.saveHistory();
      }
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      this.messages = [...this.messages, errorMessage];
      this.saveHistory();
    } finally {
      this.isLoading = false;
      await this.updateComplete;
      this.scrollToBottom();
    }
  }

  private handleClearHistory() {
    if (confirm('Are you sure you want to clear the entire conversation history?')) {
      this.messages = [];
      this.conversationId = null;
      storage.clearConversation();
    }
  }

  render() {
    return html`
      ${this.messages.length > 0
        ? html`
            <div class="actions-bar">
              <div class="actions-bar-left">
                <button
                  class="button secondary"
                  @click="${this.handleClearHistory}"
                  ?disabled="${this.isLoading}"
                  title="Clear conversation history"
                >
                  Clear History
                </button>
              </div>
            </div>
          `
        : ''}

      <div class="messages">
        ${this.messages.length === 0 && !this.isLoading
          ? html`
              <div class="empty-state">
                <h2>Welcome to Home Assistant Assist</h2>
                <p>Start a conversation by typing a message below.</p>
                <p>Try asking: "What time is it?" or "Turn on the living room lights"</p>
              </div>
            `
          : this.messages.map(
              (message) => html`
                <message-bubble .message="${message}"></message-bubble>
              `
            )}
        
        ${this.isLoading
          ? html`
              <div class="thinking-indicator">
                <span class="spinner"></span>
                <span>Assistant is thinking...</span>
              </div>
            `
          : ''}
      </div>

      <div class="input-container">
        <textarea
          class="input-field"
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          .value="${this.inputValue}"
          @input="${this.handleInput}"
          @keypress="${this.handleKeyPress}"
          ?disabled="${this.isLoading}"
          rows="1"
        ></textarea>
        <button
          class="button"
          @click="${this.sendMessage}"
          ?disabled="${this.isLoading || !this.inputValue.trim()}"
        >
          Send
        </button>
      </div>
    `;
  }
}
