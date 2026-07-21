import path from "node:path";
import { defineConfig } from "vite";
import vueTermui from "vue-termui/vite";

export default defineConfig({
	plugins: [vueTermui()],
	resolve: {
		alias: {
			"@chess-now/api": path.resolve(__dirname, "../api/src"),
			"@": path.resolve(__dirname, "../../src"),
		},
	},
});
