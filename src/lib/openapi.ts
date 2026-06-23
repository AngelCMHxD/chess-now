import { createOpenAPI } from "fumadocs-openapi/server";

export const openapi = createOpenAPI({
	input: [
		await fetch("http://localhost:8080/api/openapi").then((res) =>
			res.json(),
		),
	],
});
