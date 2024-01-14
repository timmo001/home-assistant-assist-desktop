<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri";
  import { onMount } from "svelte";
  import { attachConsole, info } from "tauri-plugin-log-api";

  import { type Settings } from "../types/settings";
  import { generateHomeAssistantURLFromSettings } from "../lib/homeAssistant";

  // Get production status from environment
  let isProduction = import.meta.env.PROD;

  let settings: Settings = {
    home_assistant: {
      access_token: "",
      host: "homeassistant.local",
      port: 8123,
      ssl: true,
    },
  };
  let home_assistant_url = "";
  let saveDisabled = true;

  onMount(() => {
    attachConsole().then(() => info("Attached console"));

    invoke("load_settings").then((result: unknown) => {
      settings = result as Settings;
      info(`Loaded settings: ${JSON.stringify({ settings })}`);
      home_assistant_url = generateHomeAssistantURLFromSettings(
        settings.home_assistant
      );
      validate();
    });
  });

  function validate(): void {
    info(`Validating settings: ${JSON.stringify({ home_assistant_url })}`);
    if (home_assistant_url === "") {
      info("Home Assistant URL is empty");
      saveDisabled = true;
      return;
    }
    if (isProduction && !home_assistant_url.startsWith("https://")) {
      info("Home Assistant URL is not HTTPS");
      saveDisabled = true;
      return;
    }
    if (!isProduction && !home_assistant_url.startsWith("http")) {
      info("Home Assistant URL is not HTTP");
      saveDisabled = true;
      return;
    }

    saveDisabled = false;
    info(
      `Validated settings: ${JSON.stringify({
        home_assistant_url,
        saveDisabled,
      })}`
    );
  }

  function saveSettings(): void {
    if (home_assistant_url.startsWith("http:")) {
      console.warn(
        "Please provide a HTTPS URL for Home Assistant. HTTP is not supported."
      );
      return;
    }

    if (home_assistant_url.endsWith("/")) {
      home_assistant_url = home_assistant_url.slice(0, -1);
    }

    settings.home_assistant.host = home_assistant_url.split("://")[1];
    if (settings.home_assistant.host.includes(":")) {
      settings.home_assistant.port = parseInt(
        settings.home_assistant.host.split(":")[1]
      );

      settings.home_assistant.host = settings.home_assistant.host.split(":")[0];
    } else {
      settings.home_assistant.port = 443;
    }
    settings.home_assistant.ssl = home_assistant_url.startsWith("https");
    invoke("update_settings", { settings }).then(() => {
      info("Saved settings");
      invoke("open_app");
    });
  }
</script>

<main class="scrollable">
  <section>
    <h2>General</h2>
    <div class="input-box">
      <span>Autostart</span>
      <input bind:checked={settings.autostart} class="input" type="checkbox" />
    </div>
  </section>
  <section>
    <h2>Home Assistant</h2>
    <span>
      Please enter the <b>HTTPS</b> URL of your Home Assistant instance and a Long-lived
      access token. You can create a Long-lived access token in your Home Assistant
      profile.
    </span>
    <div class="input-box">
      <span>Home Assistant URL</span>
      <input
        bind:value={home_assistant_url}
        autocomplete="off"
        class="input"
        type="text"
        placeholder="Enter a host"
        on:change={validate}
      />
    </div>
    <div class="input-box">
      <span>Home Assistant Token</span>
      <input
        bind:value={settings.home_assistant.access_token}
        autocomplete="off"
        class="input"
        type="text"
        placeholder="Enter an access token"
        on:change={validate}
      />
    </div>
  </section>
  <section class="button-container">
    <button
      class="button button-enabled"
      on:click={() => {
        invoke("open_app");
      }}
    >
      Cancel
    </button>
    <button
      disabled={saveDisabled}
      class={`button ${saveDisabled ? "" : "button-enabled"}`}
      on:click={saveSettings}
    >
      Save
    </button>
  </section>
</main>

<style>
  .button-container {
    height: 100%;
    width: 100%;
    margin: 0.2rem;
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  .button {
    background-color: rgba(248, 248, 248, 0.8);
    border: none;
    color: rgb(28, 28, 28);
    margin: 0.6rem;
    padding: 0.6rem 1.2rem;
    text-align: center;
    text-decoration: none;
    font-size: 1rem;
    cursor: pointer;
  }

  .button-enabled {
    background-color: rgba(248, 248, 248, 1);
  }

  .button-enabled:hover {
    background-color: rgba(248, 248, 248, 0.9);
  }

  .input-box {
    min-height: 42px;
  }

  .input-box input {
    font-size: 1rem;
  }
</style>
