import "./styles.css";
import App from "./App.svelte";

const element = document.getElementById("app");

if (!element) {
  throw new Error("Could not find element with id 'app'");
}

const app = new App({
  target: element,
});

export default app;
