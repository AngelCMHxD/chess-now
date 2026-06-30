import {
	createFileSystemGeneratorCache,
	createGenerator,
} from "fumadocs-typescript";

export const generator = createGenerator({
	tsconfigPath: "./tsconfig.json",
	cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});
