import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
	plugins: [deviceAuthorizationClient()],
	baseURL: process.env.API_BASE_URL,
	basePath: process.env.BETTER_AUTH_PATH,
});
export type Session = typeof auth.$Infer.Session;
