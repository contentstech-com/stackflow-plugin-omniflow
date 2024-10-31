import { defineConfig } from "@solidjs/start/config";
import UnocssVitePlugin from "unocss/vite";

export default defineConfig({
	ssr: false,
	vite: {
		plugins: [UnocssVitePlugin()],
		optimizeDeps: {
			include: ["@stackflow/core"],
		},
	},
});
