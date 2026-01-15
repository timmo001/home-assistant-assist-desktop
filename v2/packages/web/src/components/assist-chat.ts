import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { backendClient } from '../lib/backend-client';
import { storage, type StoredMessage } from '../lib/storage';
import './message-bubble';
import '../elements/ha-button';
import '../elements/ha-textarea';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

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
      padding: var(--ha-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-4);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--ha-color-text-secondary);
      text-align: center;
      padding: var(--ha-space-8);
      gap: var(--ha-space-4);
    }

    .empty-state h2 {
      margin: 0;
      font-size: var(--ha-font-size-xl);
      font-weight: var(--ha-font-weight-medium);
      color: var(--ha-color-text);
    }

    .empty-state p {
      margin: 0;
      max-width: 400px;
      font-size: var(--ha-font-size-base);
    }

    .input-container {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-3);
      padding: var(--ha-space-4);
      margin: var(--ha-space-4);
      background-color: var(--ha-color-surface);
      border-radius: var(--ha-border-radius-lg);
      box-shadow: var(--ha-shadow-lg);
    }

    .input-row {
      display: flex;
      gap: var(--ha-space-3);
      align-items: flex-end;
    }

    ha-textarea {
      flex: 1;
      --wa-input-height-medium: auto;
    }

    ha-textarea::part(base) {
      min-height: 42px;
      max-height: 150px;
      background-color: transparent;
      border: none;
    }

    ha-textarea::part(textarea) {
      background-color: transparent;
    }

    .send-button {
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      padding: 0;
    }

    .send-button::part(base) {
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: transparent;
      border: none;
      color: var(--ha-color-fill-primary-loud);
    }

    .send-button:not([disabled])::part(base):hover {
      background-color: transparent;
      color: var(--ha-color-fill-primary);
    }

    .send-button wa-icon {
      font-size: 1.5rem;
    }

    .pipeline-info {
      font-size: var(--ha-font-size-xs);
      color: var(--ha-color-text-secondary);
      padding: 0 var(--ha-space-2);
      margin-left: var(--ha-space-2);
    }

    .thinking-indicator {
      display: flex;
      align-items: center;
      gap: var(--ha-space-3);
      padding: var(--ha-space-4);
      background-color: var(--ha-color-surface);
      border-radius: var(--ha-border-radius-md);
      color: var(--ha-color-text-secondary);
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--ha-space-3) var(--ha-space-4);
      background-color: var(--ha-color-surface);
      border-bottom: 1px solid var(--ha-color-border);
    }

    .actions-bar-left {
      display: flex;
      gap: var(--ha-space-3);
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

  @state()
  private pipelineId: string | null = null;

  @state()
  private pipelineName: string | null = null;

  @query('.messages')
  private messagesContainer!: HTMLElement;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadHistory();
    await this.loadPipeline();
  }

  /**
   * Load pipeline from settings or auto-select
   */
  private async loadPipeline() {
    try {
      // Get available pipelines first
      const pipelinesResult = await backendClient.getPipelines();
      
      if (!pipelinesResult.success || pipelinesResult.pipelines.length === 0) {
        console.error('No pipelines available');
        return;
      }
      
      // Try to get selected pipeline from settings
      const settingsResult = await backendClient.getSettings();
      
      if (settingsResult.settings?.selectedPipelineId) {
        this.pipelineId = settingsResult.settings.selectedPipelineId;
        // Find pipeline name
        const pipeline = pipelinesResult.pipelines.find((p: any) => p.id === this.pipelineId);
        this.pipelineName = pipeline?.name || this.pipelineId;
        console.log('Using pipeline from settings:', this.pipelineName);
        return;
      }

      // Fall back to auto-selection (preferred or first)
      this.pipelineId = pipelinesResult.preferredPipeline || pipelinesResult.pipelines[0].id;
      const pipeline = pipelinesResult.pipelines.find((p: any) => p.id === this.pipelineId);
      this.pipelineName = pipeline?.name || this.pipelineId;
      console.log('Auto-selected pipeline:', this.pipelineName);
    } catch (error) {
      console.error('Failed to load pipeline:', error);
    }
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

  private handleInput(e: CustomEvent) {
    const textarea = e.target as any;
    this.inputValue = textarea.value;
  }

  private handleKeyDown(e: KeyboardEvent) {
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
      // Check if pipeline is loaded
      if (!this.pipelineId) {
        throw new Error('No pipeline available. Please check your Home Assistant configuration.');
      }

      const result = await backendClient.runPipeline({
        text: messageContent,
        pipelineId: this.pipelineId,
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
                <ha-button
                  variant="secondary"
                  size="small"
                  @click="${this.handleClearHistory}"
                  ?disabled="${this.isLoading}"
                  title="Clear conversation history"
                >
                  Clear History
                </ha-button>
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
                <wa-spinner></wa-spinner>
                <span>Assistant is thinking...</span>
              </div>
            `
          : ''}
      </div>

      <div class="input-container">
        <div class="input-row">
          <ha-textarea
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            .value="${this.inputValue}"
            @wa-input="${this.handleInput}"
            @keydown="${this.handleKeyDown}"
            ?disabled="${this.isLoading}"
            rows="1"
            resize="auto"
          ></ha-textarea>
          <ha-button
            variant="text"
            class="send-button"
            @click="${this.sendMessage}"
            ?disabled="${this.isLoading || !this.inputValue.trim()}"
            title="Send message"
          >
            <wa-icon name="paper-plane"></wa-icon>
          </ha-button>
        </div>
        ${this.pipelineName
          ? html`
              <div class="pipeline-info">
                ${this.pipelineName}
              </div>
            `
          : ''}
      </div>
    `;
  }
}
