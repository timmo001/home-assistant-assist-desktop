<script lang="ts">
  import { Router, Route, Link } from "svelte-routing";
  import HomePage from "./pages/Home.svelte";
  import SettingsPage from "./pages/Settings.svelte";
</script>

<Router>
  <Route path="/" component={HomePage} />
  <Route path="/settings" component={SettingsPage} />
</Router>
