import { mount } from 'svelte';
import "./reset.css";
import "./app.css";
import App from "./components/App.svelte";
import "./stores/Automation.ts";

const app = mount(App, { target: document.getElementById("app") });

export default app
