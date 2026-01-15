import { Hono } from "hono";
import { getHomeAssistantSettings } from "../config.js";
import { HomeAssistantClient, type PipelineRunEvent } from "../ha/client.js";

export const pipelineRoutes = new Hono();

// Store active HA client connection
let haClient: HomeAssistantClient | null = null;

/**
 * Get or create HA client connection
 */
async function getHAClient(): Promise<HomeAssistantClient> {
  const settings = getHomeAssistantSettings();

  if (!settings) {
    throw new Error("Home Assistant not configured");
  }

  // Parse URL to get host/port/ssl
  const url = new URL(settings.url);
  const config = {
    host: url.hostname,
    port: parseInt(url.port) || (url.protocol === "https:" ? 443 : 80),
    ssl: url.protocol === "https:",
    accessToken: settings.accessToken,
  };

  // Reuse existing client if connected
  if (haClient && haClient.connected) {
    return haClient;
  }

  // Create new client
  haClient = new HomeAssistantClient();
  await haClient.connect(config);

  return haClient;
}

/**
 * GET /api/pipelines
 * List all available assist pipelines
 */
pipelineRoutes.get("/", async (c) => {
  try {
    const client = await getHAClient();
    const result = await client.listAssistPipelines();

    return c.json({ 
      success: true, 
      pipelines: result?.pipelines || [],
      preferredPipeline: result?.preferred_pipeline || null
    });
  } catch (error) {
    console.error("Error listing pipelines:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list pipelines",
      },
      500
    );
  }
});

/**
 * POST /api/pipelines/run-text
 * Execute a pipeline with text input
 * 
 * Body: {
 *   text: string,
 *   pipelineId?: string,
 *   conversationId?: string
 * }
 */
pipelineRoutes.post("/run-text", async (c) => {
  try {
    const body = await c.req.json<{
      text: string;
      pipelineId?: string;
      conversationId?: string;
    }>();

    if (!body.text) {
      return c.json(
        { success: false, error: "Text input is required" },
        400
      );
    }

    const client = await getHAClient();
    const settings = getHomeAssistantSettings();

    // Use provided pipeline ID or the selected one from settings
    const pipelineId = body.pipelineId || settings?.selectedPipelineId;

    if (!pipelineId) {
      return c.json(
        {
          success: false,
          error: "No pipeline specified. Please select a pipeline in settings.",
        },
        400
      );
    }

    // Start pipeline run
    const result = await new Promise<{ response: string; events: PipelineRunEvent[] }>(async (resolve, reject) => {
      const events: PipelineRunEvent[] = [];
      let response = "";
      let timeoutId: NodeJS.Timeout;

      // Timeout after 30 seconds
      timeoutId = setTimeout(() => {
        reject(new Error("Pipeline execution timeout"));
      }, 30000);

      try {
        const unsubscribe = await client.runAssistPipeline(
          {
            start_stage: "intent",
            end_stage: "intent",
            pipeline: pipelineId,
            conversation_id: body.conversationId || null,
            input: {
              text: body.text,
            },
          },
          (event: PipelineRunEvent) => {
            events.push(event);
            
            // Debug logging
            console.log(`[Pipeline Event] ${event.type}:`, JSON.stringify(event.data, null, 2));

            // Capture the response text from intent-end event
            if (event.type === "intent-end") {
              // Try intent_output.response.speech.plain.speech first (conversation agent)
              if (event.data?.intent_output?.response?.speech?.plain?.speech) {
                response = event.data.intent_output.response.speech.plain.speech;
                console.log(`[Response Captured from intent_output] ${response}`);
              }
              // Fallback to response.speech.plain.speech (legacy format)
              else if (event.data?.response?.speech?.plain?.speech) {
                response = event.data.response.speech.plain.speech;
                console.log(`[Response Captured from response] ${response}`);
              }
            }

            // Pipeline completed
            if (event.type === "run-end") {
              clearTimeout(timeoutId);
              console.log(`[Pipeline Complete] Final response: ${response}`);
              resolve({ response, events });
            }

            // Pipeline error
            if (event.type === "error") {
              clearTimeout(timeoutId);
              reject(new Error(event.data?.message || "Pipeline execution failed"));
            }
          }
        );

        if (!unsubscribe) {
          clearTimeout(timeoutId);
          reject(new Error("Failed to start pipeline"));
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });

    return c.json({ success: true, response: result.response, events: result.events });
  } catch (error) {
    console.error("Error running pipeline:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to run pipeline",
      },
      500
    );
  }
});

/**
 * POST /api/pipelines/run-audio
 * Execute a pipeline with audio input
 * 
 * This is a stub for Phase 4 (voice support)
 */
pipelineRoutes.post("/run-audio", async (c) => {
  return c.json(
    {
      success: false,
      error: "Audio pipelines not yet implemented (Phase 4)",
    },
    501
  );
});
