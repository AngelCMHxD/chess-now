import { Chess, type Move } from "chess.js";
import z from "zod";
import { auth } from "@/lib/auth";
import { app } from "..";
import { getMatchInfo, updateBoard } from "../helper";

export const headersType = z.object({
	authorization: z
		.string({
			error: "An 'authorization' header is required",
		})
		.startsWith("Bearer ", {
			error: "'authorization' header must start with 'Bearer '",
		}),
});

export const bodyType = z.object({
	move: z.string({
		error: "'body' is required and is a string containing the move in SAN notation",
	}),
});

export async function run(
	bearer: string,
	matchId: string,
	body: z.infer<typeof bodyType>,
) {
	const session = await auth.api.getSession({
		headers: {
			Authorization: bearer,
		},
	});

	if (!session) {
		return {
			type: "error",
			content: {
				code: 401,
				error: "Unauthorized",
			},
		};
	}

	if (session.session.scopes && !session.session.scopes.includes("matches"))
		return {
			type: "error",
			content: {
				code: 403,
				error: "Forbidden",
			},
		};

	const mId = parseInt(matchId, 10);

	if (Number.isNaN(mId))
		return {
			type: "error",
			content: {
				code: 400,
				error: "Bad Request",
			},
		};

	const match = await getMatchInfo(mId);

	if (!match)
		return {
			type: "error",
			content: {
				code: 404,
				error: "Not Found",
			},
		};

	const players = [match.whiteId, match.blackId];

	if (!players.includes(session.user.id))
		return {
			type: "error",
			content: {
				code: 403,
				error: "Forbidden",
			},
		};

	const roles = {
		[match.whiteId]: "w",
		[match.blackId]: "b",
	};

	const chess = new Chess();
	if (!match.pgn) {
		chess.load(match.fen);
	} else {
		chess.loadPgn(match.pgn);
	}

	const turnBefore = chess.turn();
	const pgnBefore = chess.pgn();
	if (roles[session.user.id] !== turnBefore)
		return {
			type: "error",
			content: {
				code: 409,
				error: "Conflict",
			},
		};

	let move: Move;

	try {
		move = chess.move(body.move);
	} catch (_e) {
		return {
			type: "error",
			content: {
				code: 422,
				error: "Unprocessable Content",
			},
		};
	}

	await updateBoard(match.id, chess);

	const pgnAfter = chess.pgn();
	const turnAfter = chess.turn();

	const content = {
		boardId: mId,
		players: {
			whiteId: match.whiteId,
			blackId: match.blackId,
		},
		turn: {
			before: turnBefore,
			after: turnAfter,
		},
		pgn: {
			before: pgnBefore,
			after: pgnAfter,
		},
		fen: {
			before: move.before,
			after: move.after,
		},
		san: move.san,
		lan: move.lan,
		piece: move.piece,
	};

	players.forEach((playerId) => {
		app.server.publish(
			`board:${playerId}`,
			JSON.stringify({
				type: "board:move",
				content: {
					...content,
					websocketUserId: playerId,
				},
			}),
		);
	});

	return {
		type: "success",
		content,
	};
}

export default { bodyType, headersType, run };
