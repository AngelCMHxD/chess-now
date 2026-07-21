<script setup lang="ts">
import type { Challenge } from "@chess-now/api";
import { RGBA } from "@opentui/core";
import { ref } from "vue";
import { Box, bold, fg, onKeyDown, Text, t, underline } from "vue-termui";
import { chessClient } from "../main";

const props = defineProps<{
	show: boolean;
	challenge?: Challenge;
}>();

const emit = defineEmits(["close", "action"]);

const yellow = fg("yellow");
const red = fg("red");

const loading = ref(false);
const errorMsg = ref("");
enum HoverState {
	Accept = 0,
	Reject = 1,
}
const hoveredIndex = ref<HoverState>(HoverState.Accept);

const acceptChallenge = async () => {
	if (props.challenge?.id === undefined) return;
	loading.value = true;
	errorMsg.value = "";
	try {
		await chessClient.acceptChallenge(props.challenge.id);
		emit("action");
		emit("close");
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message ||
			"Failed to accept challenge";
	} finally {
		loading.value = false;
	}
};

const rejectChallenge = async () => {
	if (props.challenge?.id === undefined) return;
	loading.value = true;
	errorMsg.value = "";
	try {
		await chessClient.denyChallenge(props.challenge.id);
		emit("action");
		emit("close");
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message ||
			"Failed to reject challenge";
	} finally {
		loading.value = false;
	}
};

onKeyDown((key) => {
	if (!props.show) return;
	if (key.name === "escape") {
		emit("close");
		errorMsg.value = "";
	} else if (
		key.name === "left" ||
		key.name === "right" ||
		key.name === "tab"
	) {
		hoveredIndex.value =
			hoveredIndex.value === HoverState.Accept
				? HoverState.Reject
				: HoverState.Accept;
	} else if (key.name === "return" || key.name === "enter") {
		if (hoveredIndex.value === HoverState.Accept) {
			acceptChallenge();
		} else {
			rejectChallenge();
		}
	}
});
</script>

<template>
	<Box
		v-if="show"
		position="absolute"
		:top="5"
		:left="30"
		:backgroundColor="RGBA.defaultBackground()"
		border
		flexDirection="column"
		:padding="1"
		:width="40"
	>
		<Text :content="t`${bold('Challenge Details')}`" />
		<Text :content="'More info here... (placeholder)'" :marginTop="1" />
		<Box flexDirection="row" :marginTop="1" justifyContent="space-around">
			<Box
				@mouseDown="acceptChallenge"
				@mouseOver="hoveredIndex = HoverState.Accept"
			>
				<Text
					:content="t`${hoveredIndex === HoverState.Accept ? underline(yellow('[Accept]')) : '[Accept]'}`"
				/>
			</Box>
			<Box
				@mouseDown="rejectChallenge"
				@mouseOver="hoveredIndex = HoverState.Reject"
			>
				<Text
					:content="t`${hoveredIndex === HoverState.Reject ? underline(yellow('[Reject]')) : '[Reject]'}`"
				/>
			</Box>
		</Box>
		<Text v-if="errorMsg" :content="t`${red(errorMsg)}`" :marginTop="1" />
		<Text
			v-if="loading"
			:content="t`${yellow('Processing...')}`"
			:marginTop="1"
		/>
	</Box>
</template>
