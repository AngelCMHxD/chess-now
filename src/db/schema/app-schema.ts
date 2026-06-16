import { relations } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const matchStatus = pgEnum("status", [
	"active",
	"draw",
	"white_won",
	"black_won",
]);

export const matches = pgTable("match", {
	id: varchar("id").primaryKey(),
	whiteId: varchar("white_id")
		.references(() => user.id)
		.notNull(),
	blackId: varchar("black_id")
		.references(() => user.id)
		.notNull(),
	status: matchStatus("status").default("active").notNull(),
	fen: varchar("fen")
		.notNull()
		.default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
	pgn: varchar("pgn"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
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
