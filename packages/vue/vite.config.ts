import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [vue()],
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "EvccIconsVue",
			fileName: "index",
			formats: ["es", "cjs"],
		},
		rollupOptions: {
			external: ["vue", "@evcc/icons"],
			output: {
				exports: "named",
				globals: {
					vue: "Vue",
					"@evcc/icons": "EvccIcons",
				},
			},
		},
	},
});
