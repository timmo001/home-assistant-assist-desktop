/**
 * @ha-assist/shared-types
 * 
 * Shared TypeScript type definitions for Home Assistant Assist v2
 */

// Settings
export type { HomeAssistantSettings, Settings } from "./settings.js";

// Pipeline
export type {
  AssistPipeline,
  ConversationResult,
  IntentProgressEvent,
  PipelineRun,
  PipelineRunEvent,
  PipelineRunOptions,
  ResolvedMediaSource,
  SpeechMetadata,
} from "./pipeline.js";

// Messages
export { MessageType } from "./message.js";
export type { Message } from "./message.js";

// API
export { WebSocketMessageType } from "./api.js";
export type {
  AuthLoginRequest,
  AuthLoginResponse,
  PipelineListResponse,
  SettingsGetResponse,
  SettingsUpdateRequest,
  SettingsUpdateResponse,
  WebSocketConnectionStatusMessage,
  WebSocketMessage,
  WebSocketMessageUpdateMessage,
  WebSocketPipelineErrorMessage,
  WebSocketPipelineEventMessage,
} from "./api.js";
