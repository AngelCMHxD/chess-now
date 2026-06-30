import type { AutoTypeTableProps } from "fumadocs-typescript/ui";
import { AutoTypeTable } from "fumadocs-typescript/ui";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { generator } from "@/lib/generator";

export function getMDXComponents(components?: MDXComponents) {
	return {
		...defaultMdxComponents,
		AutoTypeTable: (props: Partial<AutoTypeTableProps>) => (
			<AutoTypeTable {...props} generator={generator} />
		),
		...components,
	} satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
	type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
