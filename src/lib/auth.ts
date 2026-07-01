import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { bearer, captcha, deviceAuthorization } from "better-auth/plugins";
import { Resend } from "resend";
import { Emails } from "@/emails/default";
import { db, secondaryStorage } from "./database";

const disableSignUp = process.env.DISABLE_SIGNUPS === "true";

const isDev = () =>
	["development", "test"].includes(process.env.NODE_ENV || "development");

function logIfExample(email: string) {
	if (email.split("@")[1] === "example.com") {
		console.log("Email not sent! @example.com");
		return true;
	}
	return false;
}

const resend = new Resend(process.env.RESEND_API_KEY);

const privateEndpoints = [
	"/device/code",
	"/device/approve",
	"/device/deny",
	"/device/token",
	"/update-session",
];

export const auth = betterAuth({
	baseURL: process.env.NEXT_PUBLIC_BASE_URL,
	basePath: process.env.BETTER_AUTH_PATH,
	plugins: [
		bearer(),
		deviceAuthorization({
			verificationUri: "/device",
			schema: {},
		}),
		captcha({
			provider: "cloudflare-turnstile",
			secretKey:
				process.env.TURNSTILE_SECRET_KEY ||
				"1x0000000000000000000000000000000AA",
		}),
		nextCookies(),
	],
	session: {
		additionalFields: {
			scopes: {
				type: "string[]",
				required: false,
			},
		},
		storeSessionInDatabase: true,
		cookieCache: {
			enabled: true,
		},
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (privateEndpoints.includes(ctx.path)) {
				const isInternalCall =
					ctx.headers?.get("x-internal-call") ===
					process.env.INTERNAL_API_SECRET;

				if (!isInternalCall) {
					throw new APIError("FORBIDDEN", {
						code: "PRIVATE_ENDPOINT",
						message:
							"This is a private endpoint. There might be a public equivalent available, look at the docs ;P",
					});
				}
			}

			return { context: ctx };
		}),
	},
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	secondaryStorage,
	user: {
		deleteUser: {
			enabled: false,
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		disableSignUp,
		sendResetPassword: async (data) => {
			if (isDev()) console.log(`Reset password link: ${data.url}`);
			if (logIfExample(data.user.email)) return;

			void resend.emails.send({
				from: process.env.EMAIL_FROM as string,
				to: [data.user.email],
				subject: "Password reset - Chess Now!",
				react: Emails.PasswordReset({ url: data.url }),
			});
		},
		onPasswordReset: async (data) => {
			if (isDev()) console.log(`${data.user.name}: Password changed.`);
			if (logIfExample(data.user.email)) return;

			void resend.emails.send({
				from: process.env.EMAIL_FROM as string,
				to: [data.user.email],
				subject: "Password changed successfully - Chess Now!",
				react: Emails.PasswordChanged(),
			});
		},
	},
	socialProviders: {
		discord: {
			disableSignUp,
			clientId: process.env.DISCORD_CLIENT_ID as string,
			clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
		},
		google: {
			disableSignUp,
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			accessType: "offline",
			prompt: "select_account consent",
		},
	},
	emailVerification: {
		sendVerificationEmail: async (data) => {
			if (isDev()) console.log(`Verification email: ${data.url}`);
			if (logIfExample(data.user.email)) return;

			void resend.emails.send({
				from: process.env.EMAIL_FROM as string,
				to: [data.user.email],
				subject: "Verify your email - Chess Now!",
				react: Emails.Activation({ url: data.url }),
			});
		},
		afterEmailVerification: async (user, _request) => {
			if (isDev()) console.log(`${user.name}: Email verified.`);
			if (logIfExample(user.email)) return;

			void resend.emails.send({
				from: process.env.EMAIL_FROM as string,
				to: [user.email],
				subject: "Welcome - Chess Now!",
				react: Emails.Welcome({
					url: `${process.env.NEXT_PUBLIC_BASE_URL}/account/dashboard`,
				}),
			});
		},
		autoSignInAfterVerification: true,
	},
	advanced: {
		database: {
			generateId: () => crypto.randomUUID(),
		},
	},
});
