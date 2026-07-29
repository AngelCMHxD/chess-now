<script setup lang="ts">
import type { Match, ServerMessage } from "@chess-now/api";
import { Chess } from "chess.js";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import {
	Box,
	bold,
	fg,
	Input,
	onKeyDown,
	Text,
	t,
	underline,
} from "vue-termui";
import SidebarComponent from "../components/SidebarComponent.vue";
import { chessClient } from "../main";
import { router } from "../router";
import { state } from "../store";
import { getBoardAscii } from "../utils";

const route = useRoute();
const matchId = Number(route.params.id);

const yellow = fg("yellow");
const hoverYellow = fg("#FFFF99");
const green = fg("green");
const red = fg("red");

function formatRatingDiff(diff: number | null | undefined) {
	if (diff == null) return "";
	if (diff > 0) return green(`(+${diff})`);
	if (diff < 0) return red(`(${diff})`);
	return "(0)";
}

const chess = new Chess();
const boardAscii = ref("");
const inputKey = ref(0);
const errorMsg = ref("");
const matchDetails = ref<Match | null>(null);
const draftMove = ref("");

const goToMatchListHovered = ref(false);
const offerDrawHovered = ref(false);
const forfeitHovered = ref(false);

const isBlack = computed(() => {
	return matchDetails.value?.blackId === state.user?.id;
});

function updateBoard() {
	boardAscii.value = getBoardAscii(chess, isBlack.value);
}

const handleMatchMove = (event: ServerMessage<"match:board_move">) => {
	if (event.payload.match.id === matchId) {
		matchDetails.value = event.payload.match;
		chess.load(event.payload.match.fen);
		updateBoard();
		errorMsg.value = "";
	}
};

const handleMatchGameOver = (event: ServerMessage<"match:game_over">) => {
	if (event.payload.match.id === matchId && matchDetails.value) {
		matchDetails.value.status = event.payload.match.status;
		matchDetails.value.endReason = event.payload.match.endReason;
	}
};

const handleDrawRequest = (event: ServerMessage<"match:draw_request">) => {
	if (event.payload.match.id === matchId) {
		router.push(`/matches/${matchId}/draw`);
	}
};

const goToMatchList = () => {
	router.push("/matches");
};

const goToForfeit = () => {
	router.push(`/matches/${matchId}/forfeit`);
};

const offerDraw = async () => {
	errorMsg.value = "";
	try {
		await chessClient.requestDraw(matchId);
		router.push(`/matches/${matchId}/draw`);
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to offer draw";
	}
};

onMounted(async () => {
	try {
		const match = await chessClient.getMatch(matchId);
		matchDetails.value = match;
		chess.load(match.fen);
		updateBoard();

		if (match.status === "active" && match.activeDrawRequest !== null) {
			router.push(`/matches/${matchId}/draw`);
			return;
		}

		chessClient.on("match:board_move", handleMatchMove);
		chessClient.on("match:game_over", handleMatchGameOver);
		chessClient.on("match:draw_request", handleDrawRequest);
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to load match";
	}
});

onUnmounted(() => {
	chessClient.off("match:board_move", handleMatchMove);
	chessClient.off("match:game_over", handleMatchGameOver);
	chessClient.off("match:draw_request", handleDrawRequest);
});

const submitMove = async () => {
	const moveSan = draftMove.value.trim();
	if (!moveSan) return;
	errorMsg.value = "";

	// validate locally
	try {
		const testChess = new Chess();
		testChess.load(chess.fen());
		testChess.move(moveSan);
	} catch (_e) {
		errorMsg.value = "Invalid move (local validation)";
		return;
	}

	try {
		const res = await chessClient.makeMove(matchId, moveSan);
		draftMove.value = "";
		inputKey.value++;

		chess.load(res.match.fen);
		updateBoard();
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to make move";
	}
};

onKeyDown((key) => {
	if (key.name === "return" || key.name === "enter") {
		submitMove();
	}
});
</script>

<template>
	<Box flexDirection="row" width="100%" height="100%">
		<SidebarComponent />
		<Box
			id="play-match"
			border
			flexDirection="column"
			alignItems="center"
			:flexGrow="1"
			:paddingX="1"
			:marginLeft="1"
		>
			<Text :content="t`${bold('Match')} #${matchId}`" />

			<Box v-if="errorMsg" :marginTop="1">
				<Text :content="t`${red(errorMsg)}`" />
			</Box>

			<Box
				v-if="matchDetails"
				:marginTop="1"
				flexDirection="column"
				alignItems="center"
			>
				<Box
					v-if="matchDetails.status === 'active'"
					:marginTop="1"
					flexDirection="column"
					alignItems="center"
				>
					<Text
						:content="t`${bold(matchDetails.whitePlayer.name)} (@${matchDetails.whitePlayer.username}) vs. ${bold(matchDetails.blackPlayer.name)} (@${matchDetails.blackPlayer.username})`"
					/>
				</Box>
				<Box
					v-if="matchDetails.status !== 'active'"
					:marginTop="1"
					flexDirection="column"
					alignItems="center"
					:gap="1"
				>
					<Text
						:content="t`${bold(matchDetails.whitePlayer.name)} (@${matchDetails.whitePlayer.username}) ${formatRatingDiff(matchDetails.whiteRatingDiff)} vs. ${bold(matchDetails.blackPlayer.name)} (@${matchDetails.blackPlayer.username}) ${formatRatingDiff(matchDetails.blackRatingDiff)}`"
					/>
					<Text
						:content="t`${yellow(`Game Over: ${matchDetails.status} - ${matchDetails.endReason}`)}`"
					/>
				</Box>
			</Box>

			<Box :marginTop="1" border :paddingX="2" :paddingY="1">
				<Text :content="boardAscii" />
			</Box>

			<Box
				v-if="matchDetails?.status === 'active'"
				:marginTop="1"
				flexDirection="column"
				alignItems="center"
			>
				<Text
					:content="'Enter your move (LAN/SAN format, e.g. Nf3, e2e4):'"
				/>
				<Box :marginTop="1" :width="20">
					<Input
						:key="inputKey"
						v-model="draftMove"
						placeholder="Move..."
						autofocus
					/>
				</Box>
			</Box>

			<Box flexDirection="row" :marginTop="1" :gap="2">
				<Box
					v-if="matchDetails?.status === 'active'"
					@mouseOver="() => offerDrawHovered = true"
					@mouseOut="() => offerDrawHovered = false"
					@mouseDown="offerDraw"
				>
					<Text
						:content="t`${offerDrawHovered ? underline(hoverYellow('[Offer Draw]')) : yellow('[Offer Draw]')}`"
					/>
				</Box>

				<Box
					v-if="matchDetails?.status === 'active'"
					@mouseOver="() => forfeitHovered = true"
					@mouseOut="() => forfeitHovered = false"
					@mouseDown="goToForfeit"
				>
					<Text
						:content="t`${forfeitHovered ? underline(red('[Forfeit]')) : red('[Forfeit]')}`"
					/>
				</Box>

				<Box
					@mouseOver="() => goToMatchListHovered = true"
					@mouseOut="() => goToMatchListHovered = false"
					@mouseDown="goToMatchList"
				>
					<Text
						:content="t`${goToMatchListHovered ? underline(hoverYellow('[Go to Match List]')) : yellow('[Go to Match List]')}`"
					/>
				</Box>
			</Box>
		</Box>
	</Box>
</template>
