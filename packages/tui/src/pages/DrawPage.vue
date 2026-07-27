<script setup lang="ts">
import type { Match, ServerMessage } from "@chess-now/api";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { Box, bold, fg, onKeyDown, Text, t, underline } from "vue-termui";
import SidebarComponent from "../components/SidebarComponent.vue";
import { chessClient } from "../main";
import { router } from "../router";
import { state } from "../store";

const route = useRoute();
const matchId = Number(route.params.id);

const yellow = fg("yellow");
const hoverYellow = fg("#FFFF99");
const red = fg("red");

const errorMsg = ref("");
const matchDetails = ref<Match | null>(null);

enum HoverState {
	Accept = 0,
	Deny = 1,
}
const hoveredIndex = ref<HoverState>(HoverState.Accept);

const isBlack = computed(() => matchDetails.value?.blackId === state.user?.id);

const userOfferDraw = computed(() => {
	if (!matchDetails.value) return false;
	return isBlack.value
		? matchDetails.value.blackRequestedDraw
		: matchDetails.value.whiteRequestedDraw;
});

const opponentOfferedDraw = computed(() => {
	if (!matchDetails.value) return false;
	return isBlack.value
		? matchDetails.value.whiteRequestedDraw
		: matchDetails.value.blackRequestedDraw;
});

const handleRedirectEvent = (
	event: ServerMessage<"match:game_over" | "match:draw_deny">,
) => {
	if (event.payload.match.id === matchId) {
		router.push(`/matches/${matchId}`);
	}
};

const acceptDraw = async () => {
	errorMsg.value = "";
	try {
		await chessClient.acceptDraw(matchId);
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to accept draw";
	}
};

const denyDraw = async () => {
	errorMsg.value = "";
	try {
		await chessClient.denyDraw(matchId);
		router.push(`/matches/${matchId}`);
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to deny draw";
	}
};

onMounted(async () => {
	try {
		const match = await chessClient.getMatch(matchId);

		if (match.status !== "active" || match.activeDrawRequest === null) {
			router.push(`/matches/${matchId}`);
			return;
		}

		matchDetails.value = match;

		chessClient.on("match:game_over", handleRedirectEvent);
		chessClient.on("match:draw_deny", handleRedirectEvent);
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to load match";
	}
});

onUnmounted(() => {
	chessClient.off("match:game_over", handleRedirectEvent);
	chessClient.off("match:draw_deny", handleRedirectEvent);
});

onKeyDown((key) => {
	if (userOfferDraw.value) return;

	if (key.name === "left" || key.name === "right" || key.name === "tab") {
		hoveredIndex.value =
			hoveredIndex.value === HoverState.Accept
				? HoverState.Deny
				: HoverState.Accept;
	} else if (key.name === "return" || key.name === "enter") {
		if (hoveredIndex.value === HoverState.Accept) acceptDraw();
		else if (hoveredIndex.value === HoverState.Deny) denyDraw();
	} else if (key.name === "y" || key.name === "Y") {
		acceptDraw();
	} else if (key.name === "n" || key.name === "N") {
		denyDraw();
	}
});
</script>

<template>
	<Box flexDirection="row" width="100%" height="100%">
		<SidebarComponent />
		<Box
			id="draw-match"
			border
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			:flexGrow="1"
			:paddingX="1"
			:marginLeft="1"
		>
			<Text :content="t`${bold('Match')} #${matchId} - Draw Offer`" />

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
					<Box
						v-if="userOfferDraw"
						flexDirection="column"
						alignItems="center"
					>
						<Text
							:content="`${yellow('You have offered a draw')}`"
						/>
						<Text content="Waiting for them to respond..." />
					</Box>

					<Box
						v-if="opponentOfferedDraw"
						flexDirection="column"
						alignItems="center"
					>
						<Text
							:content="`${yellow('Your opponent has offered a draw')}`"
						/>

						<Box flexDirection="row" :marginTop="1" :gap="2">
							<Box
								@mouseDown="acceptDraw"
								@mouseOver="hoveredIndex = HoverState.Accept"
								autofocus
							>
								<Text
									:content="t`${hoveredIndex === HoverState.Accept ? underline(hoverYellow('[Accept]')) : yellow('[Accept]')}`"
								/>
							</Box>
							<Box
								@mouseDown="denyDraw"
								@mouseOver="hoveredIndex = HoverState.Deny"
							>
								<Text
									:content="t`${hoveredIndex === HoverState.Deny ? underline(hoverYellow('[Decline]')) : yellow('[Decline]')}`"
								/>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	</Box>
</template>
