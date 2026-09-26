import { mount } from "svelte";
import App from "./App.svelte";

const destino = document.getElementById("app");
if (!destino) throw new Error("Falta el elemento #app en index.html");

export default mount(App, { target: destino });
