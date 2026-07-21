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
const red = fg("red");

const chess = new Chess();
const boardAscii = ref("");
const inputKey = ref(0);
const errorMsg = ref("");
const matchDetails = ref<Match | null>(null);
const draftMove = ref("");
const goToMatchListHovered = ref(false);

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

const goToMatchList = () => {
	router.push("/matches");
};

onMounted(async () => {
	try {
		const match = await chessClient.getMatch(matchId);
		matchDetails.value = match;
		chess.load(match.fen);
		updateBoard();

		chessClient.on("match:board_move", handleMatchMove);
		chessClient.on("match:game_over", handleMatchGameOver);
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to load match";
	}
});

onUnmounted(() => {
	chessClient.off("match:board_move", handleMatchMove);
	chessClient.off("match:game_over", handleMatchGameOver);
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
				<Text
					:content="t`${bold(matchDetails.whitePlayer?.username || 'White')} vs ${bold(matchDetails.blackPlayer?.username || 'Black')}`"
				/>
				<Box v-if="matchDetails.status !== 'active'" :marginTop="1">
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

			<Box :marginTop="1">
				<Text
					:content="t`${goToMatchListHovered ? underline(yellow('[Go to Match List]')) : yellow('[Go to Match List]')}`"
					@mouseOver="() => goToMatchListHovered = true"
					@mouseOut="() => goToMatchListHovered = false"
					@mouseDown="() => goToMatchList()"
				/>
			</Box>
		</Box>
	</Box>
</template>
