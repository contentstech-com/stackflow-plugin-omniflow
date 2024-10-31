import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

build({
	entryPoints: ["src/index.tsx"],
	bundle: true,
	outdir: "dist",
	format: "esm",
	plugins: [solidPlugin()],
}).catch(() => process.exit(1));
