import { relations } from "drizzle-orm";
import {
	integer,
	pgEnum,
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const matchRules = pgEnum("match_rules", ["noRematch", "noDraw"]);

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

export const challengeStatus = pgEnum("challenge_status", [
	"pending",
	"denied",
	"expired",
	"ongoing",
	"finished",
]);

export const challenges = pgTable("challenge", {
	id: serial("id").primaryKey(),
	from: varchar("from")
		.references(() => user.id)
		.notNull(),
	to: varchar("to")
		.references(() => user.id)
		.notNull(),
	rules: matchRules("rules").array().default([]).notNull(),
	challengerColor: startingColor("challenger_color")
		.default("random")
		.notNull(),
	timeLimit: integer("time_limit").default(1440).notNull(),
	status: challengeStatus("status").default("pending").notNull(),
	matchId: integer("matchId").references(() => matches.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("match", {
	id: serial("id").primaryKey(),
	whiteId: varchar("white_id")
		.references(() => user.id)
		.notNull(),
	blackId: varchar("black_id")
		.references(() => user.id)
		.notNull(),
	status: matchStatus("status").default("active").notNull(),
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
		relationName: "whitePlayer",
	}),
	blackPlayer: one(user, {
		fields: [matches.blackId],
		references: [user.id],
		relationName: "blackPlayer",
	}),
}));

export const challengeRelations = relations(challenges, ({ one }) => ({
	match: one(matches, {
		fields: [challenges.matchId],
		references: [matches.id],
		relationName: "whitePlayer",
	}),
}));
