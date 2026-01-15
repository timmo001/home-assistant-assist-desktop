/**
 * localStorage wrapper with ha-assist: prefix for namespacing
 */

const PREFIX = 'ha-assist:';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: string; // ISO string for serialization
}

export interface StoredConversation {
  conversationId: string | null;
  messages: StoredMessage[];
}

/**
 * Storage utility class for managing localStorage with namespacing
 */
export class Storage {
  private prefix: string;

  constructor(prefix: string = PREFIX) {
    this.prefix = prefix;
  }

  /**
   * Get a value from localStorage
   */
  private get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error);
      return null;
    }
  }

  /**
   * Set a value in localStorage
   */
  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error);
    }
  }

  /**
   * Remove a value from localStorage
   */
  private remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.get<string>('token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.set('token', token);
  }

  /**
   * Remove authentication token
   */
  clearToken(): void {
    this.remove('token');
  }

  /**
   * Get conversation history
   */
  getConversation(): StoredConversation {
    const stored = this.get<StoredConversation>('conversation');
    return stored || { conversationId: null, messages: [] };
  }

  /**
   * Set conversation history
   */
  setConversation(conversation: StoredConversation): void {
    this.set('conversation', conversation);
  }

  /**
   * Clear conversation history
   */
  clearConversation(): void {
    this.remove('conversation');
  }

  /**
   * Clear all ha-assist data from localStorage
   */
  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const storage = new Storage();
