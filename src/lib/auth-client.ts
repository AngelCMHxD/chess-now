import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	plugins: [deviceAuthorizationClient()],
	baseURL: "http://localhost:8080",
	basePath: process.env.BETTER_AUTH_PATH,
});
export type Session = typeof authClient.$Infer.Session;
