import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { backendClient } from '../lib/backend-client';
import { storage, type StoredMessage } from '../lib/storage';
import './message-bubble';
import '../elements/ha-button';
import '../elements/ha-textarea';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

interface Command {
  name: string;
  aliases: string[];
  description: string;
  category?: 'navigation' | 'pipeline' | 'conversation' | 'help';
  handler: () => void | Promise<void>;
}

interface CommandSuggestion {
  command: Command;
  matchedName: string;
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

    /* Command Dropdown Styles */
    .input-wrapper {
      position: relative;
    }

    .command-dropdown {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      margin-bottom: var(--ha-space-2);
      background-color: var(--ha-color-surface);
      border: 1px solid var(--ha-color-border);
      border-radius: var(--ha-border-radius-md);
      box-shadow: var(--ha-shadow-lg);
      max-height: 300px;
      overflow-y: auto;
      z-index: 10;
    }

    .command-item {
      padding: var(--ha-space-3);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-1);
      transition: background-color 0.15s;
    }

    .command-item:hover,
    .command-item.selected {
      background-color: var(--ha-color-fill-primary-subtle);
    }

    .command-header {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2);
    }

    .command-name {
      font-weight: var(--ha-font-weight-semibold);
      color: var(--ha-color-fill-primary-loud);
      font-size: var(--ha-font-size-sm);
    }

    .command-aliases {
      font-size: var(--ha-font-size-xs);
      color: var(--ha-color-text-tertiary);
    }

    .command-description {
      font-size: var(--ha-font-size-xs);
      color: var(--ha-color-text-secondary);
      line-height: 1.4;
    }

    .command-kbd {
      display: inline-block;
      padding: 2px 6px;
      font-size: var(--ha-font-size-xs);
      font-family: monospace;
      background-color: var(--ha-color-fill-neutral-subtle);
      border: 1px solid var(--ha-color-border);
      border-radius: var(--ha-border-radius-xs);
      color: var(--ha-color-text-secondary);
    }

    /* Help Dialog Styles */
    .help-content {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-4);
    }

    .help-command {
      padding: var(--ha-space-3);
      border-left: 3px solid var(--ha-color-fill-primary-loud);
      background-color: var(--ha-color-fill-primary-subtle);
      border-radius: var(--ha-border-radius-sm);
    }

    .help-command-header {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2);
      margin-bottom: var(--ha-space-1);
      font-size: var(--ha-font-size-base);
    }

    .help-aliases {
      font-size: var(--ha-font-size-sm);
      color: var(--ha-color-text-secondary);
    }

    .help-command-description {
      font-size: var(--ha-font-size-sm);
      color: var(--ha-color-text-secondary);
    }

    .help-content code {
      padding: 2px 6px;
      background-color: var(--ha-color-fill-neutral-subtle);
      border-radius: var(--ha-border-radius-xs);
      font-family: monospace;
      font-size: var(--ha-font-size-sm);
    }

    /* Pipeline Dialog Styles */
    .pipeline-dialog-content {
      display: flex;
      flex-direction: column;
      min-width: 400px;
    }

    wa-radio-group {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2);
    }

    wa-radio {
      padding: var(--ha-space-3);
      border: 1px solid var(--ha-color-border);
      border-radius: var(--ha-border-radius-md);
      transition: border-color 0.2s, background-color 0.2s;
    }

    wa-radio:hover {
      border-color: var(--ha-color-fill-primary-loud);
      background-color: var(--ha-color-fill-primary-subtle);
    }

    wa-radio[checked] {
      border-color: var(--ha-color-fill-primary-loud);
      background-color: var(--ha-color-fill-primary-subtle);
    }

    .pipeline-option {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-1);
    }

    .pipeline-option-name {
      font-weight: var(--ha-font-weight-medium);
      color: var(--ha-color-text);
    }

    .pipeline-option-description {
      font-size: var(--ha-font-size-sm);
      color: var(--ha-color-text-secondary);
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

  @state()
  private showCommandDropdown: boolean = false;

  @state()
  private commandSuggestions: CommandSuggestion[] = [];

  @state()
  private selectedCommandIndex: number = 0;

  @state()
  private showPipelineDialog: boolean = false;

  @state()
  private showHelpDialog: boolean = false;

  @state()
  private availablePipelines: Array<{id: string, name: string, description?: string}> = [];

  @state()
  private selectedPipelineIdTemp: string = '';

  @state()
  private setAsDefault: boolean = false;

  @query('.messages')
  private messagesContainer!: HTMLElement;

  @query('ha-textarea')
  private textareaElement!: any;

  private commands: Command[] = [
    {
      name: 'settings',
      aliases: [],
      description: 'Navigate to settings page',
      category: 'navigation',
      handler: () => this.handleSettingsCommand()
    },
    {
      name: 'model',
      aliases: ['pipeline'],
      description: 'Change the assist pipeline/model',
      category: 'pipeline',
      handler: () => this.handleModelCommand()
    },
    {
      name: 'clear',
      aliases: [],
      description: 'Clear conversation history',
      category: 'conversation',
      handler: () => this.handleClearCommand()
    },
    {
      name: 'help',
      aliases: ['?', 'commands'],
      description: 'Show available commands',
      category: 'help',
      handler: () => this.handleHelpCommand()
    }
  ];

  async connectedCallback() {
    super.connectedCallback();
    await this.loadHistory();
    await this.loadPipeline();
  }

  async firstUpdated() {
    // Attach keyboard listener to the actual textarea inside ha-textarea
    await this.updateComplete;
    if (this.textareaElement) {
      const textarea = this.textareaElement.shadowRoot?.querySelector('textarea');
      if (textarea) {
        textarea.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeyDown(e));
      }
    }
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
    
    // Check if input starts with '/'
    if (this.inputValue.startsWith('/') && this.inputValue.length > 1) {
      this.updateCommandSuggestions(this.inputValue.substring(1).toLowerCase());
    } else if (this.inputValue.startsWith('/')) {
      // Show all commands when just '/' is typed
      this.showAllCommands();
    } else {
      // Hide dropdown if not a command
      this.showCommandDropdown = false;
    }
  }

  private updateCommandSuggestions(query: string) {
    const suggestions: CommandSuggestion[] = [];
    
    for (const command of this.commands) {
      // Check if command name matches
      if (command.name.toLowerCase().startsWith(query)) {
        suggestions.push({ command, matchedName: command.name });
      }
      
      // Check if any alias matches
      for (const alias of command.aliases) {
        if (alias.toLowerCase().startsWith(query)) {
          suggestions.push({ command, matchedName: alias });
          break; // Only add once per command
        }
      }
    }
    
    this.commandSuggestions = suggestions;
    this.selectedCommandIndex = 0;
    this.showCommandDropdown = suggestions.length > 0;
  }

  private showAllCommands() {
    this.commandSuggestions = this.commands.map(cmd => ({
      command: cmd,
      matchedName: cmd.name
    }));
    this.selectedCommandIndex = 0;
    this.showCommandDropdown = true;
  }

  private async executeCommand(suggestion: CommandSuggestion) {
    this.showCommandDropdown = false;
    this.inputValue = ''; // Clear input
    
    try {
      await suggestion.command.handler();
    } catch (error) {
      this.addSystemMessage(`Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }

  private addSystemMessage(content: string, type: 'info' | 'success' | 'error' = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌'
    };
    
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `${icons[type]} ${content}`,
      timestamp: new Date()
    };
    
    this.messages = [...this.messages, message];
    this.saveHistory();
    this.updateComplete.then(() => this.scrollToBottom());
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Handle command dropdown navigation
    if (this.showCommandDropdown) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedCommandIndex = Math.min(
            this.selectedCommandIndex + 1,
            this.commandSuggestions.length - 1
          );
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          this.selectedCommandIndex = Math.max(this.selectedCommandIndex - 1, 0);
          break;
          
        case 'Enter':
          e.preventDefault();
          if (this.commandSuggestions.length > 0) {
            this.executeCommand(this.commandSuggestions[this.selectedCommandIndex]);
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          this.showCommandDropdown = false;
          break;
          
        case 'Tab':
          e.preventDefault();
          if (this.commandSuggestions.length > 0) {
            // Auto-complete to first suggestion
            const suggestion = this.commandSuggestions[0];
            this.inputValue = `/${suggestion.matchedName} `;
            this.showCommandDropdown = false;
          }
          break;
      }
      return;
    }
    
    // Normal message sending
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  private async sendMessage() {
    if (!this.inputValue.trim() || this.isLoading) {
      return;
    }

    // Don't send if it's a command
    if (this.inputValue.startsWith('/')) {
      this.addSystemMessage('Unknown command. Type /help for available commands.', 'error');
      this.inputValue = '';
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

  /**
   * Command Handlers
   */
  private handleSettingsCommand() {
    window.location.hash = 'settings';
    this.addSystemMessage('Navigating to settings...', 'success');
  }

  private handleClearCommand() {
    if (this.messages.length === 0) {
      this.addSystemMessage('Conversation is already empty.', 'info');
      return;
    }
    
    if (confirm('Are you sure you want to clear the entire conversation history?')) {
      this.messages = [];
      this.conversationId = null;
      storage.clearConversation();
      this.addSystemMessage('Conversation history cleared.', 'success');
    }
  }

  private handleHelpCommand() {
    this.showHelpDialog = true;
  }

  private async handleModelCommand() {
    // Load available pipelines if not already loaded
    if (this.availablePipelines.length === 0) {
      this.isLoading = true;
      await this.updateComplete;
      
      try {
        await this.loadAvailablePipelines();
      } catch (error) {
        this.addSystemMessage(
          `Failed to load pipelines: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error'
        );
        this.isLoading = false;
        return;
      }
      
      this.isLoading = false;
    }
    
    // Check if we have any pipelines
    if (this.availablePipelines.length === 0) {
      this.addSystemMessage('No pipelines available. Please configure your Home Assistant connection in settings.', 'error');
      return;
    }
    
    // Set temporary selection to current pipeline
    this.selectedPipelineIdTemp = this.pipelineId || this.availablePipelines[0].id;
    this.setAsDefault = false;
    
    // Show dialog
    this.showPipelineDialog = true;
  }

  private async loadAvailablePipelines() {
    const result = await backendClient.getPipelines();
    
    if (!result.success || !result.pipelines) {
      throw new Error(result.error || 'Failed to load pipelines');
    }
    
    this.availablePipelines = result.pipelines.map((p: any) => ({
      id: p.id,
      name: p.name || p.id,
      description: p.description || ''
    }));
  }

  private handlePipelineRadioChange(e: CustomEvent) {
    const radioGroup = e.target as any;
    this.selectedPipelineIdTemp = radioGroup.value;
  }

  private handleSetDefaultChange(e: CustomEvent) {
    const checkbox = e.target as any;
    this.setAsDefault = checkbox.checked;
  }

  private handleClosePipelineDialog() {
    this.showPipelineDialog = false;
  }

  private handleCloseHelpDialog() {
    this.showHelpDialog = false;
  }

  private async handleApplyPipeline() {
    // Update current session
    this.pipelineId = this.selectedPipelineIdTemp;
    const pipeline = this.availablePipelines.find(p => p.id === this.pipelineId);
    this.pipelineName = pipeline?.name || this.pipelineId;
    
    // If "Set as default" is checked, save to backend
    if (this.setAsDefault) {
      try {
        const result = await backendClient.saveSettings({
          selectedPipelineId: this.pipelineId
        });
        
        if (result.success) {
          this.addSystemMessage(
            `Switched to pipeline "${this.pipelineName}" and saved as default.`,
            'success'
          );
        } else {
          this.addSystemMessage(
            `Switched to pipeline "${this.pipelineName}" (failed to save as default: ${result.error})`,
            'error'
          );
        }
      } catch (error) {
        this.addSystemMessage(
          `Switched to pipeline "${this.pipelineName}" (failed to save as default)`,
          'error'
        );
      }
    } else {
      this.addSystemMessage(
        `Switched to pipeline "${this.pipelineName}" for this session.`,
        'success'
      );
    }
    
    // Close dialog
    this.showPipelineDialog = false;
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
        <div class="input-wrapper">
          ${this.showCommandDropdown ? html`
            <div class="command-dropdown">
              ${this.commandSuggestions.map((suggestion, index) => html`
                <div 
                  class="command-item ${index === this.selectedCommandIndex ? 'selected' : ''}"
                  @click="${() => this.executeCommand(suggestion)}"
                  @mouseenter="${() => this.selectedCommandIndex = index}"
                >
                  <div class="command-header">
                    <span class="command-name">/${suggestion.matchedName}</span>
                    ${suggestion.command.aliases.length > 0 ? html`
                      <span class="command-aliases">
                        (${suggestion.command.aliases.map(a => `/${a}`).join(', ')})
                      </span>
                    ` : ''}
                  </div>
                  <span class="command-description">${suggestion.command.description}</span>
                  ${index === this.selectedCommandIndex ? html`
                    <div style="margin-top: 4px;">
                      <span class="command-kbd">↵</span> to execute
                      <span class="command-kbd">↑↓</span> to navigate
                    </div>
                  ` : ''}
                </div>
              `)}
            </div>
          ` : ''}
          
          <div class="input-row">
            <ha-textarea
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              .value="${this.inputValue}"
              @wa-input="${this.handleInput}"
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
        </div>
        
        ${this.pipelineName
          ? html`
              <div class="pipeline-info">
                ${this.pipelineName}
              </div>
            `
          : ''}
      </div>

      <!-- Help Dialog -->
      <wa-dialog
        ?open="${this.showHelpDialog}"
        @wa-request-close="${this.handleCloseHelpDialog}"
        label="Available Commands"
      >
        <div class="help-content">
          <p style="margin-bottom: var(--ha-space-4); color: var(--ha-color-text-secondary);">
            Type <code>/</code> to see available commands, or type a command directly.
          </p>
          
          ${this.commands.map(cmd => html`
            <div class="help-command">
              <div class="help-command-header">
                <strong>/${cmd.name}</strong>
                ${cmd.aliases.length > 0 ? html`
                  <span class="help-aliases">
                    ${cmd.aliases.map(a => `/${a}`).join(', ')}
                  </span>
                ` : ''}
              </div>
              <div class="help-command-description">
                ${cmd.description}
              </div>
            </div>
          `)}
        </div>
        
        <div slot="footer">
          <ha-button variant="primary" @click="${this.handleCloseHelpDialog}">
            Close
          </ha-button>
        </div>
      </wa-dialog>

      <!-- Pipeline Selection Dialog -->
      <wa-dialog
        ?open="${this.showPipelineDialog}"
        @wa-request-close="${this.handleClosePipelineDialog}"
        label="Select Pipeline"
      >
        <div class="pipeline-dialog-content">
          <p style="margin-bottom: var(--ha-space-4); color: var(--ha-color-text-secondary);">
            Choose which assist pipeline to use for your conversations.
          </p>
          
          ${this.isLoading ? html`
            <div style="display: flex; align-items: center; gap: var(--ha-space-2); margin: var(--ha-space-4) 0;">
              <wa-spinner></wa-spinner>
              <span>Loading pipelines...</span>
            </div>
          ` : html`
            <wa-radio-group
              value="${this.selectedPipelineIdTemp}"
              @wa-change="${this.handlePipelineRadioChange}"
            >
              ${this.availablePipelines.map(pipeline => html`
                <wa-radio value="${pipeline.id}">
                  <div class="pipeline-option">
                    <div class="pipeline-option-name">${pipeline.name}</div>
                    ${pipeline.description ? html`
                      <div class="pipeline-option-description">${pipeline.description}</div>
                    ` : ''}
                  </div>
                </wa-radio>
              `)}
            </wa-radio-group>
            
            <div style="margin-top: var(--ha-space-4); padding-top: var(--ha-space-4); border-top: 1px solid var(--ha-color-border);">
              <wa-checkbox
                ?checked="${this.setAsDefault}"
                @wa-change="${this.handleSetDefaultChange}"
              >
                Set as default pipeline (save to settings)
              </wa-checkbox>
            </div>
          `}
        </div>
        
        <div slot="footer">
          <ha-button variant="secondary" @click="${this.handleClosePipelineDialog}">
            Cancel
          </ha-button>
          <ha-button variant="primary" @click="${this.handleApplyPipeline}" ?disabled="${this.isLoading}">
            Apply
          </ha-button>
        </div>
      </wa-dialog>
    `;
  }
}
