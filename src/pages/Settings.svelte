<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri";
  import { onMount } from "svelte";

  import { type Settings } from "../types/settings";

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

  onMount(() => {
    invoke("load_settings").then((result: unknown) => {
      settings = result as Settings;
      console.log("Loaded settings:", settings);
    });
  });
</script>

<!-- TODO: Rework to use URL instead and extract host, port and ssl from this. -->
<main>
  <div class="input-box">
    <input
      bind:value={settings.home_assistant.host}
      autocomplete="off"
      class="input"
      type="text"
      placeholder="Enter a host"
    />
  </div>
  <div class="input-box">
    <input
      bind:value={settings.home_assistant.port}
      autocomplete="off"
      class="input"
      type="number"
      placeholder="Enter a port"
    />
  </div>
  <div class="input-box">
    <input
      bind:value={settings.home_assistant.access_token}
      autocomplete="off"
      class="input"
      type="text"
      placeholder="Enter an access token"
    />
  </div>
  <input
    bind:checked={settings.home_assistant.ssl}
    class="input"
    type="checkbox"
    placeholder="Use SSL (This is required in production)"
  />
  <!-- TODO: Style buttons -->
  <button
    class="button"
    on:click={() => {
      invoke("open_app");
    }}
  >
    Cancel
  </button>
  <button
    class="button"
    on:click={() => {
      invoke("update_settings", {settings}).then(() => {
        console.log("Saved settings");
        invoke("open_app");
      });
    }}
  >
    Save
  </button>
</main>

<style>
</style>
