import {
  type HassConfig,
  type HassUser,
  Auth,
  Connection,
  createConnection,
  createLongLivedTokenAuth,
  getUser,
  subscribeConfig,
} from "home-assistant-js-websocket";

/**
 * Home Assistant client configuration
 */
export interface HomeAssistantConfig {
  host: string;
  port: number;
  ssl: boolean;
  accessToken: string;
}

/**
 * Assist Pipeline types (ported from v1)
 */
export interface AssistPipeline {
  id: string;
  name: string;
  language: string;
  conversation_engine: string;
  conversation_language: string | null;
  stt_engine: string | null;
  stt_language: string | null;
  tts_engine: string | null;
  tts_language: string | null;
  tts_voice: string | null;
  wake_word_entity: string | null;
  wake_word_id: string | null;
}

export interface AssistPipelineMutableParams {
  name: string;
  language: string;
  conversation_engine: string;
  conversation_language: string | null;
  stt_engine: string | null;
  stt_language: string | null;
  tts_engine: string | null;
  tts_language: string | null;
  tts_voice: string | null;
  wake_word_entity: string | null;
  wake_word_id: string | null;
}

export interface PipelineRunOptions {
  start_stage: "intent" | "tts" | "stt" | "wake_word";
  end_stage: "stt" | "intent" | "tts";
  pipeline?: string;
  conversation_id?: string | null;
  input?: any;
}

export interface PipelineRunEvent {
  type: string;
  timestamp: string;
  data: any;
}

/**
 * Home Assistant client adapted from v1
 * 
 * This class manages the WebSocket connection to Home Assistant
 * and provides methods for interacting with the Assist Pipeline.
 */
export class HomeAssistantClient {
  private connection: Connection | null = null;
  private auth: Auth | null = null;
  private config: HomeAssistantConfig | null = null;

  // Callbacks
  private connectedCallback?: (connection: Connection, user: HassUser) => void;
  private configCallback?: (config: HassConfig) => void;

  constructor(
    connectedCallback?: (connection: Connection, user: HassUser) => void,
    configReceivedCallback?: (config: HassConfig) => void,
    config?: HomeAssistantConfig
  ) {
    this.connectedCallback = connectedCallback;
    this.configCallback = configReceivedCallback;
    this.config = config || null;
  }

  /**
   * Check if connected to Home Assistant
   */
  public get connected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get the current connection
   */
  public getConnection(): Connection | null {
    return this.connection;
  }

  /**
   * Disconnect from Home Assistant
   */
  disconnect(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  /**
   * Connect to Home Assistant
   */
  async connect(config?: HomeAssistantConfig): Promise<void> {
    if (config) {
      this.config = config;
    }

    if (this.connection) return;
    if (!this.config?.host) throw new Error("Missing Home Assistant host");
    if (!this.config?.accessToken)
      throw new Error("Missing Home Assistant access token");

    const url = `${this.config.ssl ? "https" : "http"}://${this.config.host}:${
      this.config.port
    }`;

    console.log(`Connecting to Home Assistant: ${url}`);

    // Create auth object
    this.auth = createLongLivedTokenAuth(url, this.config.accessToken);

    // Connect to Home Assistant
    this.connection = await createConnection({ auth: this.auth });

    this.connection.addEventListener("ready", () => {
      console.log("Home Assistant connection ready");
    });

    this.connection.addEventListener("disconnected", () => {
      console.log("Disconnected from Home Assistant");
      if (this.connection) {
        this.connection.reconnect();
      }
    });

    // Subscribe to config updates
    if (this.configCallback) {
      subscribeConfig(this.connection, (config: HassConfig) => {
        this.configCallback?.(config);
      });
    }

    // Get user info
    if (this.connectedCallback) {
      const user = await getUser(this.connection);
      this.connectedCallback(this.connection, user);
    }
  }

  /**
   * Run an assist pipeline
   */
  runAssistPipeline(
    options: PipelineRunOptions,
    callback: (event: PipelineRunEvent) => void
  ) {
    return this.connection?.subscribeMessage<PipelineRunEvent>(callback, {
      ...options,
      type: "assist_pipeline/run",
    });
  }

  /**
   * List all assist pipelines
   */
  listAssistPipelines() {
    return this.connection?.sendMessagePromise<{
      pipelines: AssistPipeline[];
      preferred_pipeline: string | null;
    }>({
      type: "assist_pipeline/pipeline/list",
    });
  }

  /**
   * Get a specific assist pipeline
   */
  getAssistPipeline(pipeline_id?: string) {
    return this.connection?.sendMessagePromise<AssistPipeline>({
      type: "assist_pipeline/pipeline/get",
      pipeline_id,
    });
  }

  /**
   * Create a new assist pipeline
   */
  createAssistPipeline(pipeline: AssistPipelineMutableParams) {
    return this.connection?.sendMessagePromise<AssistPipeline>({
      type: "assist_pipeline/pipeline/create",
      ...pipeline,
    });
  }

  /**
   * Update an existing assist pipeline
   */
  updateAssistPipeline(
    pipeline_id: string,
    pipeline: AssistPipelineMutableParams
  ) {
    return this.connection?.sendMessagePromise<AssistPipeline>({
      type: "assist_pipeline/pipeline/update",
      pipeline_id,
      ...pipeline,
    });
  }

  /**
   * Set the preferred assist pipeline
   */
  setAssistPipelinePreferred(pipeline_id: string) {
    return this.connection?.sendMessagePromise({
      type: "assist_pipeline/pipeline/set_preferred",
      pipeline_id,
    });
  }

  /**
   * Delete an assist pipeline
   */
  deleteAssistPipeline(pipelineId: string) {
    return this.connection?.sendMessagePromise<void>({
      type: "assist_pipeline/pipeline/delete",
      pipeline_id: pipelineId,
    });
  }

  /**
   * Fetch available assist pipeline languages
   */
  fetchAssistPipelineLanguages() {
    return this.connection?.sendMessagePromise<{ languages: string[] }>({
      type: "assist_pipeline/language/list",
    });
  }
}

/**
 * Generate a Home Assistant URL from config
 */
export function generateHomeAssistantURL(config: HomeAssistantConfig): string {
  return `${config.ssl ? "https" : "http"}://${config.host}${
    config.port === 443 ? "" : `:${config.port}`
  }`;
}
