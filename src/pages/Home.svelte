<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri";
  import { onDestroy, onMount } from "svelte";
  import {
    type Connection,
    type HassConfig,
    type HassUser,
  } from "home-assistant-js-websocket";

  import {
    type AssistResponse,
    AssistResponseType,
  } from "../types/assistResponse";
  import { type Settings } from "../types/settings";
  import {
    type AssistPipeline,
    type PipelineRunEvent,
  } from "../types/homeAssistantAssist";
  import { HomeAssistant } from "../homeAssistant";

  // TODO: Resize window to fit content and max out at 40% of the screen height
  // TODO: Text to Speech (pipeline)
  // TODO: Speech to Text (pipeline)
  // TODO: Assist pipeline picker

  // Get production status from environment
  let isProduction = import.meta.env.PROD;

  let settings: Settings = {
    home_assistant: {
      access_token: "",
      host: "homeassistant.local",
      port: 8123,
      ssl: false,
    },
  };
  let responses: AssistResponse[] = [];
  let text: string;
  let inputElement: HTMLInputElement;
  let outputElement: HTMLDivElement;
  let homeAssistantClient: HomeAssistant;
  let homeAssistantPipelines: {
    pipelines: AssistPipeline[];
    preferred_pipeline: string | null;
  };
  let homeAssistantConversationId: string | null;

  function homeAssistantConnected(
    connection: Connection,
    user: HassUser
  ): void {
    console.log("Connected to Home Assistant:", { connection, user });

    homeAssistantClient
      .listAssistPipelines()
      ?.then(
        (pipelines: {
          pipelines: AssistPipeline[];
          preferred_pipeline: string | null;
        }) => {
          console.log("Got pipelines", pipelines);
          homeAssistantPipelines = pipelines;
        }
      );
  }

  function homeAssistantConfigReceived(config: HassConfig): void {
    console.log("Got Home Assistant config:", config);
  }

  async function setupHomeAssistantConnection(): Promise<void> {
    homeAssistantClient = new HomeAssistant(
      homeAssistantConnected,
      homeAssistantConfigReceived,
      settings.home_assistant
    );
    await homeAssistantClient.connect();
  }

  function handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case "ArrowUp":
        if (responses.length === 0) return;
        if (!inputElement.selectionStart || inputElement.selectionStart > 0)
          return;

        const userResponsesUp = responses.filter(
          (response) => response.type === AssistResponseType.User
        );
        if (userResponsesUp.length > 0) {
          const nextTextId = userResponsesUp.findIndex(
            (response) => response.text === text
          );
          text =
            userResponsesUp[
              nextTextId > 0 ? nextTextId - 1 : userResponsesUp.length - 1
            ].text;
        }
        break;
      case "ArrowDown":
        if (responses.length === 0) return;
        if (
          !inputElement.selectionStart ||
          inputElement.selectionStart < text.length
        )
          return;

        const userResponsesDown = responses.filter(
          (response) => response.type === AssistResponseType.User
        );
        if (userResponsesDown.length > 0) {
          const nextTextId = userResponsesDown.findIndex(
            (response) => response.text === text
          );
          text =
            userResponsesDown[
              nextTextId < userResponsesDown.length - 1 ? nextTextId + 1 : 0
            ].text;
        }
        break;
      case "Enter":
        callPipeline();
        break;
      case "Escape":
        text = "";
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        invoke("toggle_window").then(() => console.log("Toggled window"));
        break;
    }
  }

  onMount(() => {
    invoke("load_settings").then((result: unknown) => {
      settings = result as Settings;
      console.log("Loaded settings:", settings);

      // If home assistant is not setup or is not SSL in production, load settings
      if (
        !settings.home_assistant ||
        !settings.home_assistant.host ||
        !settings.home_assistant.port ||
        (isProduction && !settings.home_assistant.ssl)
      ) {
        invoke("open_settings").then(() => console.log("Opened settings"));
        return;
      }

      setupHomeAssistantConnection().then(() => {
        inputElement.focus();
        window.addEventListener("keydown", handleKeydown);
      });
    });

    const handleBlur = () => {
      console.log("Window lost focus");
      invoke("hide_window").then(() => console.log("Window hidden"));
    };

    const handleFocus = () => {
      console.log("Window gained focus");
      window.focus();
      inputElement.focus();
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
  });

  async function callPipeline(): Promise<void> {
    // Disable input
    inputElement.disabled = true;

    // Scroll to bottom
    outputElement.scroll({
      top: outputElement.scrollHeight,
      behavior: "smooth",
    });

    // Set responses
    responses = [...responses, { type: AssistResponseType.User, text }];

    // Send to pipeline
    const unsub = await homeAssistantClient.runAssistPipeline(
      (event: PipelineRunEvent) => {
        console.log("Got pipeline event:", event);
        if (event.type === "intent-end") {
          homeAssistantConversationId =
            event.data.intent_output.conversation_id;
          const plain = event.data.intent_output.response.speech?.plain;
          if (plain) {
            // message.text = plain.speech;
            responses = [
              ...responses,
              { type: AssistResponseType.Assist, text: plain.speech },
            ];
          }
          if (unsub) unsub();
        }
        if (event.type === "error") {
          // message.text = event.data.message;
          // message.error = true;
          if (unsub) unsub();
        }

        let scrollCount = 0;
        const scrollInterval = setInterval(() => {
          outputElement.scroll({
            top: outputElement.scrollHeight,
            behavior: "smooth",
          });
          scrollCount++;
          if (scrollCount > 5) clearInterval(scrollInterval);
        }, 100);

        // Clear input
        text = "";
        inputElement.disabled = false;
        inputElement.focus();
      },
      {
        start_stage: "intent",
        input: { text },
        end_stage: "intent",
        pipeline: homeAssistantPipelines.preferred_pipeline || undefined,
        conversation_id: homeAssistantConversationId,
      }
    );
  }
</script>

<main>
  <div class="input-box query">
    <svg
      preserveAspectRatio="xMidYMid meet"
      focusable="false"
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
    >
      <g>
        <path
          d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9M10,16V19.08L13.08,16H20V4H4V16H10M17,11H15V9H17V11M13,11H11V9H13V11M9,11H7V9H9V11Z"
        >
        </path>
      </g>
    </svg>
    <input
      bind:this={inputElement}
      autocomplete="off"
      bind:value={text}
      class="input"
      id="text"
      type="text"
      placeholder="Enter a request.."
    />
  </div>
  <div bind:this={outputElement} class="output-box" id="output">
    {#each responses as response}
      <div
        class={`bubble ${
          response.type === AssistResponseType.Assist
            ? "bubble-assist"
            : "bubble-user"
        }`}
      >
        {response.text}
      </div>
    {/each}
  </div>
</main>

<style>
  .query {
    margin: 0.8rem;
  }

  .output-box {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: start;
    width: 100%;
    overflow-y: auto;
  }

  .bubble {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0.4rem 1.2rem 1.2rem 1.2rem;
    padding: 0.4rem 0.8rem;
    border-radius: 1.2rem;
    font-size: 1.2rem;
    font-weight: 400;
    line-height: 1.4;
  }

  .bubble-assist {
    align-self: flex-start;
    border-bottom-left-radius: 0;
    box-shadow: 0 0 0.2rem rgba(0, 0, 0, 0.1);
    background-color: rgba(3, 169, 244, 0.9);
    color: rgb(248, 248, 248);
  }

  .bubble-user {
    align-self: flex-end;
    border-bottom-right-radius: 0;
    box-shadow: 0 0 0.2rem rgba(0, 0, 0, 0.1);
    background-color: rgba(179, 229, 252, 0.9);
    color: rgb(24, 24, 24);
  }
</style>
