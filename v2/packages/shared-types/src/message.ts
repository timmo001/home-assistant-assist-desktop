/**
 * Message types for chat interface
 */
export enum MessageType {
  User = "user",
  Assistant = "assistant",
  Error = "error",
}

/**
 * A chat message in the conversation
 */
export interface Message {
  /**
   * Type of message
   */
  type: MessageType;
  
  /**
   * Message text content
   */
  text: string;
  
  /**
   * Whether this message is currently being streamed
   */
  streaming?: boolean;
  
  /**
   * Timestamp when the message was created
   */
  timestamp?: string;
}
