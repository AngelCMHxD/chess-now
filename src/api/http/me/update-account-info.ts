import {
	type ApiSuccessResponse,
	Scope,
	type User,
	updateAccountInfoSchema,
} from "@chess-now/api";
import { eq } from "drizzle-orm";
import type z from "zod";
import {
	APIError,
	BadRequestError,
	ForbiddenError,
	UnauthorizedError,
} from "@/api/errors";
import { hasScope, removePrivateUserFields } from "@/api/helper";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
	body: z.infer<typeof updateAccountInfoSchema>,
): Promise<ApiSuccessResponse<User>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();
	if (!hasScope(session, Scope.Account)) throw new ForbiddenError();

	if (!body.name && !body.username) {
		throw new BadRequestError("Missing name or username");
	}

	const updateData: Partial<User> = {};
	if (body.name) updateData.name = body.name;
	if (body.username) updateData.username = body.username;

	try {
		const updatedUser = await db
			.update(schemas.user)
			.set(updateData)
			.where(eq(schemas.user.id, session.user.id))
			.returning();

		if (!updatedUser.length) throw new APIError();

		return {
			success: true,
			data: removePrivateUserFields(updatedUser[0]),
		};
	} catch (err: unknown) {
		if (
			err instanceof Error &&
			err.message?.includes("unique constraint")
		) {
			throw new BadRequestError("Username is already taken");
		}
		throw new APIError(err instanceof Error ? err.message : String(err));
	}
}

export default { run, bodyType: updateAccountInfoSchema };
