import type { ApiSuccessResponse } from "@chess-now/api";
import { eq } from "drizzle-orm";
import { ForbiddenError, UnauthorizedError } from "@/api/errors";
import {
	invalidateSessionsFromSecondaryDb,
	isExternalAuth,
} from "@/api/helper";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
): Promise<ApiSuccessResponse<{ success: true }>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();
	if (isExternalAuth(session)) throw new ForbiddenError();

	await deleteUser(session.user.id);

	return {
		success: true,
		data: {
			success: true,
		},
	};
}
export async function deleteUser(userId: string) {
	const bots = await db.query.user.findMany({
		where: (user, { eq }) => eq(user.botOwnerId, userId),
	});

	for (const bot of bots) {
		await deleteUser(bot.id);
	}

	await db
		.delete(schemas.apikey)
		.where(eq(schemas.apikey.referenceId, userId));

	let deletedUser = await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.username, "deleted_user"),
	});

	if (!deletedUser) {
		deletedUser = (
			await db
				.insert(schemas.user)
				.values({
					id: "deleted_user",
					name: "Deleted User",
					email: "deleted@chessnow.local",
					username: "deleted_user",
					emailVerified: true,
				})
				.returning()
		)[0];
	}

	await db
		.update(schemas.matches)
		.set({ whiteId: deletedUser.id })
		.where(eq(schemas.matches.whiteId, userId));

	await db
		.update(schemas.matches)
		.set({ blackId: deletedUser.id })
		.where(eq(schemas.matches.blackId, userId));

	await invalidateSessionsFromSecondaryDb(userId);

	await db.delete(schemas.user).where(eq(schemas.user.id, userId));
}

export default { run };
