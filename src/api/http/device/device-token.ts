import type { ApiSuccessResponse, DeviceTokenResponse, ScopeType } from "@chess-now/api";
import z from "zod";
import { ForbiddenError } from "@/api/errors";
import { auth } from "@/lib/auth";

export const bodyType = z.object({
	deviceCode: z.string(),
});

export async function run(
	body: z.infer<typeof bodyType>,
): Promise<ApiSuccessResponse<DeviceTokenResponse>> {
	const headers = new Headers();
	headers.set("x-internal-call", process.env.INTERNAL_API_SECRET as string);

	const deviceToken = await auth.api.deviceToken({
		body: {
			grant_type: "urn:ietf:params:oauth:grant-type:device_code",
			device_code: body.deviceCode,
			client_id: "public",
		},
		headers,
	});

	if (!deviceToken) throw new ForbiddenError();

	if (deviceToken.scope) {
		const scopes = deviceToken.scope.split(" ").filter(Boolean);

		headers.set("Authorization", `Bearer ${deviceToken.access_token}`);
		headers.set(
			"x-internal-call",
			process.env.INTERNAL_API_SECRET as string,
		);

		await auth.api.updateSession({
			body: {
				scopes,
			},
			headers,
		});
	}

	return {
		success: true,
		data: {
			accessToken: deviceToken.access_token,
			tokenType: deviceToken.token_type,
			expiresIn: deviceToken.expires_in,
			scope: deviceToken.scope.split(" ") as ScopeType[],
		},
	};
}

export default { bodyType, run };
