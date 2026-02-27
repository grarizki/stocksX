import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "happy-dom",
		globals: true,
	},
	resolve: {
		alias: {
			"~": "/Users/grarizki/Documents/code/2026/stocksX/app",
			"@": "/Users/grarizki/Documents/code/2026/stocksX/app",
		},
	},
});
