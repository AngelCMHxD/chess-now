import type { Model } from "mongoose";
import { model, models, Schema } from "mongoose";

export interface DiscordUser {
	discordId: string;
	userId: string;
	accessToken: string;
	expiresAt: Date;
	activeMatchId?: number | null;
	notificationsEnabled: boolean;
}

const discordUserSchema = new Schema<DiscordUser>(
	{
		discordId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		userId: {
			type: String,
			required: true,
			index: true,
		},
		accessToken: {
			type: String,
			required: true,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		activeMatchId: {
			type: Number,
			default: null,
		},
		notificationsEnabled: {
			type: Boolean,
			default: true,
			required: true,
		},
	},
	{
		collection: "discord_user",
		timestamps: true,
	},
);

export const DiscordUserModel =
	(models.DiscordUser as Model<DiscordUser> | undefined) ||
	model<DiscordUser>("DiscordUser", discordUserSchema);
