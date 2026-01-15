/**
 * Backend API request and response types
 */

import type { Settings } from "./settings.js";
import type { AssistPipeline, PipelineRunEvent } from "./pipeline.js";
import type { Message } from "./message.js";

/**
 * Authentication
 */
export interface AuthLoginRequest {
  url: string;
  access_token: string;
}

export interface AuthLoginResponse {
  success: boolean;
  error?: string;
}

/**
 * Settings API
 */
export interface SettingsGetResponse {
  settings: Settings;
}

export interface SettingsUpdateRequest {
  settings: Partial<Settings>;
}

export interface SettingsUpdateResponse {
  success: boolean;
  settings: Settings;
}

/**
 * Pipeline API
 */
export interface PipelineListResponse {
  pipelines: AssistPipeline[];
}

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  PipelineEvent = "pipeline_event",
  PipelineError = "pipeline_error",
  MessageUpdate = "message_update",
  ConnectionStatus = "connection_status",
}

export interface WebSocketPipelineEventMessage {
  type: WebSocketMessageType.PipelineEvent;
  event: PipelineRunEvent;
}

export interface WebSocketPipelineErrorMessage {
  type: WebSocketMessageType.PipelineError;
  error: {
    code: string;
    message: string;
  };
}

export interface WebSocketMessageUpdateMessage {
  type: WebSocketMessageType.MessageUpdate;
  message: Message;
}

export interface WebSocketConnectionStatusMessage {
  type: WebSocketMessageType.ConnectionStatus;
  connected: boolean;
}

export type WebSocketMessage =
  | WebSocketPipelineEventMessage
  | WebSocketPipelineErrorMessage
  | WebSocketMessageUpdateMessage
  | WebSocketConnectionStatusMessage;
