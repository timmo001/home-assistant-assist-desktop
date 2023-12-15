<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri";
  import { onDestroy, onMount } from "svelte";
  import {
    type Connection,
    type HassConfig,
    type HassUser,
  } from "home-assistant-js-websocket";
  import { enable, disable } from "tauri-plugin-autostart-api";
  import { attachConsole, info } from "tauri-plugin-log-api";

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
    autostart: false,
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
  let currentPipeline: string | null;
  let showPipelineMenu = false;

  function homeAssistantConnected(
    connection: Connection,
    user: HassUser
  ): void {
    info(`Connected to Home Assistant:${JSON.stringify({ connection, user })}`);

    homeAssistantClient
      .listAssistPipelines()
      ?.then(
        (pipelines: {
          pipelines: AssistPipeline[];
          preferred_pipeline: string | null;
        }) => {
          info(`Got pipelines ${JSON.stringify({ pipelines })}`);
          homeAssistantPipelines = pipelines;
          currentPipeline = pipelines.preferred_pipeline;
        }
      );
  }

  function homeAssistantConfigReceived(config: HassConfig): void {
    info(`Got Home Assistant config: ${JSON.stringify({ config })}`);
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
        invoke("toggle_window").then(() => info("Toggled window"));
        break;
    }
  }

  onMount(() => {
    attachConsole().then(() => info("Attached console"));

    invoke("load_settings").then((result: unknown) => {
      settings = result as Settings;
      info(`Loaded settings: ${JSON.stringify({ settings })}`);

      // If home assistant is not setup or is not SSL in production, load settings
      if (
        !settings.home_assistant ||
        !settings.home_assistant.host ||
        !settings.home_assistant.port ||
        (isProduction && !settings.home_assistant.ssl)
      ) {
        invoke("open_settings").then(() => info("Opened settings"));
        return;
      }

      setupHomeAssistantConnection().then(() => {
        inputElement.focus();
        window.addEventListener("keydown", handleKeydown);
      });

      if (isProduction) {
        info("Running in production. Setting autostart..");
        if (settings.autostart) {
          enable().then(() => info("Autostart enabled"));
        } else {
          disable().then(() => info("Autostart disabled"));
        }
      }
    });

    const handleBlur = () => {
      info("Window lost focus");
      invoke("hide_window").then(() => info("Window hidden"));
    };

    const handleFocus = () => {
      info("Window gained focus");
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

    // Call pipeline
    const unsub = await homeAssistantClient.runAssistPipeline(
      {
        start_stage: "intent",
        input: { text },
        end_stage: "intent",
        pipeline:
          currentPipeline ||
          homeAssistantPipelines.preferred_pipeline ||
          undefined,
        conversation_id: homeAssistantConversationId,
      },
      (event: PipelineRunEvent) => {
        info(`Got pipeline event: ${JSON.stringify({ event })}`);
        if (event.type === "intent-end") {
          homeAssistantConversationId =
            event.data.intent_output.conversation_id;
          const plain = event.data.intent_output.response.speech?.plain;
          if (plain) {
            responses = [
              ...responses,
              { type: AssistResponseType.Assist, text: plain.speech },
            ];
          }
          if (unsub) unsub();
        }
        if (event.type === "error") {
          responses = [
            ...responses,
            { type: AssistResponseType.Error, text: event.data.message },
          ];
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
      }
    );
  }

  async function callVoicePipeline(): Promise<void> {
    // Clear input
    text = "";
    // Disable input
    inputElement.disabled = true;

    // Call voice pipeline
  }

  function togglePipelineMenu(): void {
    showPipelineMenu = !showPipelineMenu;
  }

  function selectPipline(pipeline: AssistPipeline): void {
    currentPipeline = pipeline.id;
    responses = [];
    showPipelineMenu = false;
  }
</script>

<main>
  <div class="input-box query">
    <button class="button-icon" on:click={togglePipelineMenu}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <title>comment-processing-outline</title>
        <path
          d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9M10,16V19.08L13.08,16H20V4H4V16H10M17,11H15V9H17V11M13,11H11V9H13V11M9,11H7V9H9V11Z"
        />
      </svg>
    </button>

    <input
      bind:this={inputElement}
      autocomplete="off"
      bind:value={text}
      class="input"
      id="text"
      type="text"
      placeholder="Enter a request.."
    />

    <button class="button-icon" on:click={callVoicePipeline}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <title>microphone-outline</title>
        <path
          d="M17.3,11C17.3,14 14.76,16.1 12,16.1C9.24,16.1 6.7,14 6.7,11H5C5,14.41 7.72,17.23 11,17.72V21H13V17.72C16.28,17.23 19,14.41 19,11M10.8,4.9C10.8,4.24 11.34,3.7 12,3.7C12.66,3.7 13.2,4.24 13.2,4.9L13.19,11.1C13.19,11.76 12.66,12.3 12,12.3C11.34,12.3 10.8,11.76 10.8,11.1M12,14A3,3 0 0,0 15,11V5A3,3 0 0,0 12,2A3,3 0 0,0 9,5V11A3,3 0 0,0 12,14Z"
        />
      </svg>
    </button>
  </div>

  <div bind:this={outputElement} class="output-box" id="output">
    {#each responses as response}
      <div
        class={`bubble ${
          response.type === AssistResponseType.Assist
            ? "bubble-assist"
            : response.type === AssistResponseType.Error
              ? "bubble-error"
              : "bubble-user"
        }`}
      >
        {response.text}
      </div>
    {/each}
  </div>

  {#if showPipelineMenu}
    <div class="dropdown-menu" on:blur={() => (showPipelineMenu = false)}>
      {#each homeAssistantPipelines.pipelines as option}
        <button
          class={`dropdown-item ${
            currentPipeline === option.id ? "selected" : ""
          }`}
          on:click={(e) => selectPipline(option)}
        >
          {option.name}
        </button>
      {/each}
    </div>
  {/if}
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

  .bubble-error {
    align-self: flex-start;
    border-bottom-left-radius: 0;
    box-shadow: 0 0 0.2rem rgba(0, 0, 0, 0.1);
    background-color: rgba(244, 67, 54, 0.9);
    color: rgb(248, 248, 248);
  }

  .bubble-user {
    align-self: flex-end;
    border-bottom-right-radius: 0;
    box-shadow: 0 0 0.2rem rgba(0, 0, 0, 0.1);
    background-color: rgba(179, 229, 252, 0.9);
    color: rgb(24, 24, 24);
  }

  .dropdown-menu {
    position: absolute;
    display: flex;
    flex-direction: column;
    top: 3.8rem;
    left: 0;
    margin: 0.8rem;
    border-radius: 1.2rem;
    background-color: rgba(28, 28, 28, 0.9);
    box-shadow: 0 0 0.2rem rgba(0, 0, 0, 0.1);
  }

  .dropdown-item {
    background: none;
    border: none;
    padding: 0.4rem 0.8rem;
    font-size: 1.2rem;
    font-weight: 400;
    line-height: 1.4;
    color: rgb(248, 248, 248);
    cursor: pointer;
  }

  .dropdown-item:hover,
  .selected {
    background-color: rgba(82, 82, 82, 0.8);
  }

  .dropdown-item:first-child {
    border-top-left-radius: 1.2rem;
    border-top-right-radius: 1.2rem;
  }

  .dropdown-item:last-child {
    border-bottom-left-radius: 1.2rem;
    border-bottom-right-radius: 1.2rem;
  }
</style>
