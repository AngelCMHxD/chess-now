import { relations } from "drizzle-orm";
import {
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const startingColor = pgEnum("starting_color", [
	"white",
	"black",
	"random",
]);

export const matchStatus = pgEnum("match_status", [
	"active",
	"draw",
	"white_won",
	"black_won",
]);

export const matchEndReason = pgEnum("match_end_reason", [
	"draw",
	"checkmate",
	"stalemate",
	"insufficient-material",
	"50-moves",
]);

export const challengeStatus = pgEnum("challenge_status", [
	"pending",
	"denied",
	"expired",
	"ongoing",
	"finished",
]);

export const friendRequests = pgTable("friend_request", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	fromId: varchar("from_id")
		.references(() => user.id)
		.notNull(),
	toId: varchar("to_id")
		.references(() => user.id)
		.notNull(),
	status: text("status", { enum: ["pending", "accepted", "denied"] })
		.notNull()
		.default("pending"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendships = pgTable("friendship", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	userAId: varchar("user_a_id")
		.references(() => user.id)
		.notNull(),
	userBId: varchar("user_b_id")
		.references(() => user.id)
		.notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challenges = pgTable("challenge", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	fromId: varchar("from_id")
		.references(() => user.id)
		.notNull(),
	toId: varchar("to_id")
		.references(() => user.id)
		.notNull(),
	challengerColor: startingColor("challenger_color")
		.default("random")
		.notNull(),
	timeLimit: integer("time_limit").default(720).notNull(),
	status: challengeStatus("status").default("pending").notNull(),
	matchId: integer("matchId").references(() => matches.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("match", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	whiteId: text("white_id")
		.references(() => user.id)
		.notNull(),
	blackId: text("black_id")
		.references(() => user.id)
		.notNull(),
	status: matchStatus("status").default("active").notNull(),
	endReason: matchEndReason("end_reason"),
	fen: varchar("fen")
		.default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
		.notNull(),
	pgn: varchar("pgn").default("").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	finishedAt: timestamp("finished_at"),
});

export const matchRelations = relations(matches, ({ one }) => ({
	whitePlayer: one(user, {
		fields: [matches.whiteId],
		references: [user.id],
		relationName: "white_player",
	}),
	blackPlayer: one(user, {
		fields: [matches.blackId],
		references: [user.id],
		relationName: "black_player",
	}),
}));

export const userMatchRelations = relations(user, ({ many }) => ({
	whiteMatches: many(matches, {
		relationName: "white_player",
	}),
	blackMatches: many(matches, {
		relationName: "black_player",
	}),
}));

export const challengeRelations = relations(challenges, ({ one }) => ({
	match: one(matches, {
		fields: [challenges.matchId],
		references: [matches.id],
	}),
	from: one(user, {
		fields: [challenges.fromId],
		references: [user.id],
		relationName: "white_player",
	}),
	to: one(user, {
		fields: [challenges.toId],
		references: [user.id],
		relationName: "black_player",
	}),
}));

export const friendRequestRelations = relations(friendRequests, ({ one }) => ({
	from: one(user, {
		fields: [friendRequests.fromId],
		references: [user.id],
		relationName: "sent_requests",
	}),
	to: one(user, {
		fields: [friendRequests.toId],
		references: [user.id],
		relationName: "received_requests",
	}),
}));

export const friendshipRelations = relations(friendships, ({ one }) => ({
	userA: one(user, {
		fields: [friendships.userAId],
		references: [user.id],
		relationName: "friendship_a",
	}),
	userB: one(user, {
		fields: [friendships.userBId],
		references: [user.id],
		relationName: "friendship_b",
	}),
}));
