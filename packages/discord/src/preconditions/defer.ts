import { Precondition } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";

export class DeferPrecondition extends Precondition {
	public constructor(
		context: Precondition.LoaderContext,
		options: Precondition.Options,
	) {
		super(context, {
			...options,
			position: 20,
		});
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply({
			flags: ["Ephemeral"],
		});

		return this.ok();
	}
}
