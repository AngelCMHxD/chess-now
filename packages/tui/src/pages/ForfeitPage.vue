<script setup lang="ts">
import type { Match, ServerMessage } from "@chess-now/api";
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { Box, bold, fg, onKeyDown, Text, t, underline } from "vue-termui";
import SidebarComponent from "../components/SidebarComponent.vue";
import { chessClient } from "../main";
import { router } from "../router";

const route = useRoute();
const matchId = Number(route.params.id);

const yellow = fg("yellow");
const hoverYellow = fg("#FFFF99");
const red = fg("red");

const errorMsg = ref("");
const matchDetails = ref<Match | null>(null);

enum HoverState {
	Yes = 0,
	No = 1,
}
const hoveredIndex = ref<HoverState>(HoverState.No);

const handleMatchGameOver = (event: ServerMessage<"match:game_over">) => {
	if (event.payload.match.id === matchId) {
		router.push(`/matches/${matchId}`);
	}
};

const confirmForfeit = async () => {
	errorMsg.value = "";
	try {
		await chessClient.forfeitMatch(matchId);
		router.push(`/matches/${matchId}`);
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to forfeit match";
	}
};

const goBack = () => {
	router.push(`/matches/${matchId}`);
};

onMounted(async () => {
	try {
		const match = await chessClient.getMatch(matchId);

		if (match.status !== "active") {
			router.push(`/matches/${matchId}`);
			return;
		}

		matchDetails.value = match;
		chessClient.on("match:game_over", handleMatchGameOver);
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to load match";
	}
});

onUnmounted(() => {
	chessClient.off("match:game_over", handleMatchGameOver);
});

onKeyDown((key) => {
	if (
		key.name === "left" ||
		key.name === "right" ||
		key.name === "up" ||
		key.name === "down" ||
		key.name === "tab"
	) {
		hoveredIndex.value =
			hoveredIndex.value === HoverState.Yes
				? HoverState.No
				: HoverState.Yes;
	} else if (key.name === "return" || key.name === "enter") {
		if (hoveredIndex.value === HoverState.Yes) confirmForfeit();
		else if (hoveredIndex.value === HoverState.No) goBack();
	} else if (key.name === "y" || key.name === "Y") {
		confirmForfeit();
	} else if (key.name === "n" || key.name === "N") {
		goBack();
	}
});
</script>

<template>
	<Box flexDirection="row" width="100%" height="100%">
		<SidebarComponent />
		<Box
			id="forfeit-match"
			border
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			:flexGrow="1"
			:paddingX="1"
			:marginLeft="1"
		>
			<Text :content="t`${bold('Match')} #${matchId} - Forfeit`" />

			<Box v-if="errorMsg" :marginTop="1">
				<Text :content="t`${red(errorMsg)}`" />
			</Box>

			<Box
				v-if="matchDetails"
				:marginTop="1"
				flexDirection="column"
				alignItems="center"
			>
				<Text
					:content="t`${bold(matchDetails.whitePlayer.name)} (@${matchDetails.whitePlayer.username}) vs. ${bold(matchDetails.blackPlayer.name)} (@${matchDetails.blackPlayer.username})`"
				/>

				<Box :marginTop="2" flexDirection="column" alignItems="center">
					<Text
						:content="`${yellow('Are you sure you want to forfeit the match?')}`"
					/>
					<Text
						content="This will count as a loss and affect your rating"
					/>

					<Box flexDirection="row" :marginTop="1" :gap="2">
						<Box
							@mouseDown="confirmForfeit"
							@mouseOver="hoveredIndex = HoverState.Yes"
						>
							<Text
								:content="t`${hoveredIndex === HoverState.Yes ? underline(hoverYellow('[Yes, forfeit]')) : yellow('[Yes, forfeit]')}`"
							/>
						</Box>
						<Box
							@mouseDown="goBack"
							@mouseOver="hoveredIndex = HoverState.No"
							autofocus
						>
							<Text
								:content="t`${hoveredIndex === HoverState.No ? underline(hoverYellow('[No, go Back]')) : yellow('[No, go Back]')}`"
							/>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	</Box>
</template>
