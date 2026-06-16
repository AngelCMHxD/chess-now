import { cors } from "@elysia/cors";
import { Elysia, t } from "elysia";
import { auth } from "@/lib/auth";

const app = new Elysia({ prefix: "/api", normalize: "typebox" })
	.use(cors())
	.mount(auth.handler)
	.listen(8080);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
