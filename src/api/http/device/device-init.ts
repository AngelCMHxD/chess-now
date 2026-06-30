import { VALID_SCOPES } from "@chess-now/api";
import type {
	ApiSuccessResponse,
	DeviceAuthInitResponse,
} from "@chess-now/api";
import z from "zod";
import { auth } from "@/lib/auth";

export const bodyType = z.object({
	scopes: z
		.array(z.enum(VALID_SCOPES))
		.min(1)
		.max(VALID_SCOPES.length)
		.transform((items) => [...new Set(items)]),
});

export async function run(
	body: z.infer<typeof bodyType>,
): Promise<ApiSuccessResponse<DeviceAuthInitResponse>> {
	const headers = new Headers();
	headers.set("x-internal-call", process.env.INTERNAL_API_SECRET as string);

	const deviceAuth = await auth.api.deviceCode({
		body: {
			client_id: "public",
			scope: body.scopes.join(" "),
		},
		headers,
	});

	return {
		success: true,
		data: {
			deviceCode: deviceAuth.device_code,
			userCode: deviceAuth.user_code,
			verificationUri: deviceAuth.verification_uri,
			verificationUriComplete: deviceAuth.verification_uri_complete,
			expiresIn: deviceAuth.expires_in,
			interval: deviceAuth.interval,
		},
	};
}

export default { bodyType, run };
