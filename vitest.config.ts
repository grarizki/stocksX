import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "happy-dom",
		globals: true,
		exclude: [...configDefaults.exclude, "tests/**/*.integration.test.ts"],
	},
	resolve: {
		alias: {
			"~": "/Users/grarizki/Documents/code/2026/stocksX/app",
			"@": "/Users/grarizki/Documents/code/2026/stocksX/app",
		},
	},
});
