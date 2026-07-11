import type {
	ApiSuccessResponse,
	DeviceInfoResponse,
	ScopeType,
} from "@chess-now/api";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/api/errors";
import { isExternalAuth } from "@/api/helper";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";

export async function run(
	headers: Headers,
	userCode: string,
): Promise<ApiSuccessResponse<DeviceInfoResponse>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();
	if (isExternalAuth(session)) throw new ForbiddenError();

	const deviceAuth = await db.query.deviceCode.findFirst({
		where: (code, { eq, and }) =>
			and(eq(code.userCode, userCode), eq(code.status, "pending")),
	});

	if (!deviceAuth) throw new NotFoundError("Device code not found");

	return {
		success: true,
		data: {
			userCode: deviceAuth.userCode,
			expiresAt: deviceAuth.expiresAt,
			scopes: (deviceAuth.scope?.split(" ") || []) as ScopeType[],
			clientId: deviceAuth.clientId || "public",
		},
	};
}

export default { run };
