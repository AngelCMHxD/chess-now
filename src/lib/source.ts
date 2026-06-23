import { loader } from "fumadocs-core/source";
import { docs } from "@/../.fumadocs/server";
import { openapi } from "@/lib/openapi";

export const source = loader(
	{
		docs: docs.toFumadocsSource(),
		openapi: await openapi.staticSource({
			baseDir: "openapi",
		}),
	},
	{
		baseUrl: "/docs",
		plugins: [openapi.loaderPlugin()],
	},
);
