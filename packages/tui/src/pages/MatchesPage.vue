<script setup lang="ts">
import { onUnmounted } from "vue";
import {
	Box,
	bold,
	computed,
	fg,
	italic,
	onKeyDown,
	onMounted,
	ref,
	Text,
	t,
	underline,
	useCurrentFocusedElement,
} from "vue-termui";
import SendChallengePopup from "../components/SendChallengePopup.vue";
import SidebarComponent from "../components/SidebarComponent.vue";
import { router } from "../router";
import { state } from "../store";

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

function formatEndReason(reason: string | null): string {
	if (!reason) return "Unknown reason";
	const formatted = reason.replace(/-/g, " ");
	return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatMiliseconds(ms: string | number): string {
	const totalSeconds = parseInt(ms.toString(), 10) / 1000;

	if (Number.isNaN(totalSeconds)) return "00:00:00";

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);

	return hours > 0
		? `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
		: minutes > 0
			? `${minutes}m ${String(seconds).padStart(2, "0")}s`
			: `${seconds}s`;
}

const now = ref(Date.now());
let interval: ReturnType<typeof setInterval>;

onMounted(async () => {
	interval = setInterval(() => {
		now.value = Date.now();
	}, 1000);
});

onUnmounted(() => {
	clearInterval(interval);
});

const currentGlobalFocus = useCurrentFocusedElement();

const hoveredIndex = ref(0);
const scrollOffset = ref(0);
const showSendChallengePopup = ref(false);
const maxVisible = 5;

const sortedMatches = computed(() => {
	return [...state.matches].sort((a, b) => {
		if (a.status === "active" && b.status !== "active") return -1;
		if (a.status !== "active" && b.status === "active") return 1;
		return b.createdAt.getTime() - a.createdAt.getTime();
	});
});

const visibleMatches = computed(() =>
	sortedMatches.value.slice(
		scrollOffset.value,
		scrollOffset.value + maxVisible,
	),
);

function adjustScroll() {
	if (hoveredIndex.value === 0) {
		scrollOffset.value = 0;
	} else {
		const arrayIndex = hoveredIndex.value - 1;
		if (arrayIndex < scrollOffset.value) {
			scrollOffset.value = arrayIndex;
		} else if (arrayIndex >= scrollOffset.value + maxVisible) {
			scrollOffset.value = arrayIndex - maxVisible + 1;
		}
	}
}

function moveUp() {
	if (hoveredIndex.value > 0) {
		hoveredIndex.value--;
		adjustScroll();
	}
}

function moveDown() {
	if (hoveredIndex.value < sortedMatches.value.length) {
		hoveredIndex.value++;
		adjustScroll();
	}
}

function handleMouseScroll(e: { scroll?: { direction: string } }) {
	if (e.scroll?.direction === "up") moveUp();
	else if (e.scroll?.direction === "down") moveDown();
}

function activate(index?: number) {
	const targetIndex = index ?? hoveredIndex.value;
	hoveredIndex.value = targetIndex;

	if (targetIndex === 0) {
		showSendChallengePopup.value = true;
	} else {
		const match = sortedMatches.value[targetIndex - 1];
		if (match) {
			router.push(`/matches/${match.id}`);
		}
	}
}

onKeyDown((key) => {
	if (currentGlobalFocus?.value?.id !== "matches") return;
	if (showSendChallengePopup.value) return;

	if (key.name === "up") {
		moveUp();
	} else if (key.name === "down") {
		moveDown();
	} else if (key.name === "return" || key.name === "enter") {
		activate();
	}
});
</script>

<template>
	<Box flexDirection="row" width="100%" height="100%">
		<SidebarComponent />
		<Box
			id="matches"
			border
			focusable
			:borderColor="currentGlobalFocus?.id === 'matches' ? '#00FFFFFF' : '#FFFFFF'"
			:flexGrow="1"
			flexDirection="column"
			:paddingX="1"
			:marginLeft="1"
			@mouseScroll="handleMouseScroll"
		>
			<Box
				flexDirection="row"
				:paddingBottom="1"
				justifyContent="space-between"
			>
				<Text
					:content="t`${bold('Match list')} | ${hoveredIndex}/${sortedMatches.length}`"
				/>
				<Box
					id="sendChallenge"
					@mouseOver="hoveredIndex = 0"
					@mouseDown="activate(0)"
				>
					<Text
						:content="t`${
							hoveredIndex === 0
								? underline(hoverYellow('[Send challenge]'))
								: yellow('[Send challenge]')
						}`"
					/>
				</Box>
			</Box>

			<Box
				:visible="sortedMatches.length === 0"
				flexDirection="column"
				alignItems="center"
				justifyContent="center"
				height="100%"
			>
				<Text :content="t`${bold('No matches found :C')}`" />
			</Box>
			<Box flexDirection="column" alignItems="flex-start" :flexGrow="1">
				<Box
					v-for="(match, index) in visibleMatches"
					:key="match.id"
					flexDirection="column"
					alignItems="flex-start"
					:marginBottom="1"
				>
					<Box
						@mouseOver="hoveredIndex = scrollOffset + index + 1"
						@mouseDown="activate(scrollOffset + index + 1)"
					>
						<Text
							:content="t`${(() => {
								const text = match.status === 'active' ? 'Continue match' : 'View details'
								const isHovered = hoveredIndex === scrollOffset + index + 1

								if (isHovered) {
									return underline(hoverYellow(`[${text}]`))
								}
								return yellow(`[${text}]`)
							})()}`"
						/>
					</Box>
					<Box :visible="match.status === 'active'">
						<Text
							:content="t`${bold(match.whitePlayer.name)} (@${match.whitePlayer.username}) vs. ${bold(match.blackPlayer.name)} (@${match.blackPlayer.username})`"
						/>
						<Text
							:content="t`${italic(bold('Currently Active'))}`"
						/>
						<Text
							:content="t`Started ${formatMiliseconds(now - match.createdAt.getTime())} ago`"
						/>
					</Box>
					<Box :visible="match.status !== 'active'">
						<Text
							:content="t`${bold(match.whitePlayer.name)} (@${match.whitePlayer.username}) ${formatRatingDiff(match.whiteRatingDiff)} vs. ${bold(match.blackPlayer.name)} (@${match.blackPlayer.username}) ${formatRatingDiff(match.blackRatingDiff)}`"
						/>
						<Text
							:content="t`Finished due to: ${formatEndReason(match.endReason)}`"
						/>
						<Text
							:visible="match.status !== 'draw'"
							:content="t`Winner: ${match.status === 'white_won' ? match.whitePlayer.name : match.blackPlayer.name}`"
						/>
						<Text
							:content="t`Lasted: ${formatMiliseconds((match.finishedAt?.getTime() || 0) - match.createdAt.getTime()) || 'Unknown duration'}`"
						/>
					</Box>
				</Box>
				<Box
					v-if="scrollOffset + visibleMatches.length < sortedMatches.length"
					:marginTop="1"
				>
					<Text
						:content="t`${yellow(`... (${scrollOffset + 1}-${scrollOffset + visibleMatches.length} of ${sortedMatches.length})`)}`"
					/>
				</Box>
			</Box>
		</Box>
		<SendChallengePopup
			:show="showSendChallengePopup"
			@close="showSendChallengePopup = false"
		/>
	</Box>
</template>
