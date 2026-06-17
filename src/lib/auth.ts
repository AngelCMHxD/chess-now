import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { bearer, captcha, deviceAuthorization } from "better-auth/plugins";
import { Resend } from "resend";
import { Emails } from "@/emails/default";
import { db } from "./database";

const isDev = () => ["development", "test"].includes(process.env.NODE_ENV);

function logIfExample(email: string) {
	if (email.split("@")[1] === "example.com") {
		console.log("Email not sent! @example.com");
		return true;
	}
	return false;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
	baseURL: "http://localhost:8080",
	trustedOrigins: ["http://localhost:3000"],
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
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	user: {
		deleteUser: {
			enabled: false,
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
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
			clientId: process.env.DISCORD_CLIENT_ID as string,
			clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
		},
		google: {
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
					url: `${process.env.BASE_URL}/account/dashboard`,
				}),
			});
		},
		autoSignInAfterVerification: true,
	},
});
