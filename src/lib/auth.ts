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

function normalizeUsername(value: string) {
	const normalized = value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");

	return normalized;
}

function randomEightDigitSuffix() {
	return Math.floor(10_000_000 + Math.random() * 90_000_000).toString();
}

async function getAvailableUsername(preferredUsername?: string) {
	const baseUsername = preferredUsername
		? normalizeUsername(preferredUsername).slice(0, 30)
		: "user";
	const username = baseUsername || "user";

	const exactMatch = await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.username, username),
		columns: { id: true },
	});

	if (!exactMatch) return username;

	for (let attempt = 0; attempt < 10; attempt++) {
		const suffix = randomEightDigitSuffix();
		const candidate = `${username.slice(0, Math.max(1, 30 - suffix.length))}${suffix}`;
		const existingUser = await db.query.user.findFirst({
			where: (user, { eq }) => eq(user.username, candidate),
			columns: { id: true },
		});

		if (!existingUser) return candidate;
	}

	throw new APIError("BAD_REQUEST", {
		message: "Unable to generate a unique username. Please try again.",
	});
}

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
			if (ctx.path === "/sign-up/email") {
				const body = ctx.body as
					| { username?: unknown; image?: unknown }
					| undefined;
				const username = body?.username;

				if (
					typeof username !== "string" ||
					!/^[a-z0-9]{3,30}$/.test(username)
				) {
					throw new APIError("BAD_REQUEST", {
						message:
							"Username is required and must be 3 to 30 characters using lowercase letters and numbers only.",
					});
				}

				const existingUser = await db.query.user.findFirst({
					where: (user, { eq }) => eq(user.username, username),
					columns: { id: true },
				});

				if (existingUser) {
					throw new APIError("BAD_REQUEST", {
						message: "Username is already taken.",
					});
				}

				const { image: _image, ...safeBody } = body ?? {};

				ctx.body = {
					...safeBody,
					username,
				};
			}

			if (ctx.path === "/update-user") {
				const body = ctx.body as
					| { image?: unknown; username?: unknown }
					| undefined;

				if (body?.image !== undefined || body?.username !== undefined) {
					throw new APIError("BAD_REQUEST", {
						message:
							"Updating username or image is not allowed from this endpoint.",
					});
				}
			}

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
		additionalFields: {
			username: {
				type: "string",
				required: true,
				unique: true,
				returned: true,
			},
		},
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
			mapProfileToUser: async (profile) => ({
				username: await getAvailableUsername(profile.username),
			}),
		},
		google: {
			disableSignUp,
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			accessType: "offline",
			prompt: "select_account consent",
			mapProfileToUser: async (profile) => ({
				username: await getAvailableUsername(profile.name),
			}),
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
