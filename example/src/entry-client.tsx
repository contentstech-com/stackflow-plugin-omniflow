// @refresh reload
import { StartClient, mount } from "@solidjs/start/client";
import "@unocss/reset/tailwind.css";
import "uno.css";

// biome-ignore lint/style/noNonNullAssertion: always exists
mount(() => <StartClient />, document.getElementById("app")!);
