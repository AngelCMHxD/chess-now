import { createOpenAPI } from "fumadocs-openapi/server";

export const openapi = createOpenAPI({
	input: [
		await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/openapi`).then(
			(res) => res.json(),
		),
	],
});
