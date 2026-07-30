console.log("Building linux x64...");
await Bun.build({
	entrypoints: ["./dist/main.js"],
	compile: {
		target: "bun-linux-x64",
		outfile: "./dist/executables/chessnow-tui-linux-x64",
	},
});
console.log("Built linux x64\n");

console.log("Building linux arm64...");
await Bun.build({
	entrypoints: ["./dist/main.js"],
	compile: {
		target: "bun-linux-arm64",
		outfile: "./dist/executables/chessnow-tui-linux-arm64",
	},
});
console.log("Built linux arm64\n");

console.log("Building windows x64...");
await Bun.build({
	entrypoints: ["./dist/main.js"],
	compile: {
		target: "bun-windows-x64",
		outfile: "./dist/executables/chessnow-tui-windows-x64",
		windows: {
			// these only work when compiling on windows
			icon: "./assets/icon.ico",
			title: "Chess Now! TUI",
			description: "A TUI client for Chess Now!",
			publisher: "AngelCMHxD",
			version: "1.0.0",
			copyright: "MIT License",
		},
	},
});
console.log("Built windows x64\n");

console.log("Building windows arm64...");
await Bun.build({
	entrypoints: ["./dist/main.js"],
	compile: {
		target: "bun-windows-arm64",
		outfile: "./dist/executables/chessnow-tui-windows-arm64",
		// these only work when compiling on windows
		windows: {
			icon: "./assets/icon.ico",
			title: "Chess Now! TUI",
			description: "A TUI client for Chess Now!",
			publisher: "AngelCMHxD",
			version: "1.0.0",
			copyright: "MIT License",
		},
	},
});
console.log("Built windows arm64\n");

console.log("Building darwin arm64...");
await Bun.build({
	entrypoints: ["./dist/main.js"],
	compile: {
		target: "bun-darwin-arm64",
		outfile: "./dist/executables/chessnow-tui-darwin-arm64",
	},
});
console.log("Built darwin arm64\n");

console.log("Building darwin x64...");
await Bun.build({
	entrypoints: ["./dist/main.js"],
	compile: {
		target: "bun-darwin-x64",
		outfile: "./dist/executables/chessnow-tui-darwin-x64",
	},
});
console.log("Built darwin arm64\n");

console.log("All platforms built!");
