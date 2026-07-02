import {
	deviceAuthorizationClient,
	inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(),
		deviceAuthorizationClient(),
	],
	baseURL: process.env.NEXT_PUBLIC_BASE_URL,
	basePath: process.env.BETTER_AUTH_PATH,
});
export type Session = typeof auth.$Infer.Session;
