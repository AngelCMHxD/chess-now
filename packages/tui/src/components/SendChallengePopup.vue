<script setup lang="ts">
import { RGBA } from "@opentui/core";
import { ref, watch } from "vue";
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
import { chessClient } from "../main";

const props = defineProps<{
	show: boolean;
}>();

const emit = defineEmits(["close", "action"]);

const yellow = fg("yellow");
const red = fg("red");

const loading = ref(false);
const errorMsg = ref("");
const username = ref("");
enum HoverState {
	Input = 0,
	Send = 1,
	Cancel = 2,
}
const hoveredIndex = ref<HoverState>(HoverState.Input);

watch(
	() => props.show,
	(newVal) => {
		if (newVal) {
			username.value = "";
			errorMsg.value = "";
			hoveredIndex.value = HoverState.Input;
		}
	},
);

const sendChallenge = async () => {
	if (!username.value.trim()) {
		errorMsg.value = "Username is required";
		return;
	}
	loading.value = true;
	errorMsg.value = "";
	try {
		await chessClient.requestChallenge(username.value.trim(), {
			color: "random",
		});
		emit("action");
		emit("close");
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to send challenge";
	} finally {
		loading.value = false;
	}
};

onKeyDown((key) => {
	if (!props.show) return;
	if (key.name === "escape") {
		emit("close");
	} else if (key.name === "up" || (key.name === "tab" && key.shift)) {
		hoveredIndex.value = (hoveredIndex.value - 1 + 3) % 3;
	} else if (key.name === "down" || (key.name === "tab" && !key.shift)) {
		hoveredIndex.value = (hoveredIndex.value + 1) % 3;
	} else if (key.name === "left" || key.name === "right") {
		if (hoveredIndex.value !== HoverState.Input) {
			hoveredIndex.value =
				hoveredIndex.value === HoverState.Send
					? HoverState.Cancel
					: HoverState.Send;
		}
	} else if (key.name === "return" || key.name === "enter") {
		if (hoveredIndex.value === HoverState.Send) {
			sendChallenge();
		} else if (hoveredIndex.value === HoverState.Cancel) {
			emit("close");
		} else if (hoveredIndex.value === HoverState.Input) {
			sendChallenge();
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
		<Text :content="t`${bold('Send Challenge')}`" />
		<Text :content="'Enter username to challenge:'" :marginTop="1" />

		<Box :marginTop="1" :width="38">
			<Input v-model="username" placeholder="username" autofocus />
		</Box>

		<Box flexDirection="row" :marginTop="1" justifyContent="space-around">
			<Box
				@mouseDown="sendChallenge"
				@mouseOver="hoveredIndex = HoverState.Send"
			>
				<Text
					:content="t`${hoveredIndex === HoverState.Send ? underline(yellow('[Send]')) : '[Send]'}`"
				/>
			</Box>
			<Box
				@mouseDown="$emit('close')"
				@mouseOver="hoveredIndex = HoverState.Cancel"
			>
				<Text
					:content="t`${hoveredIndex === HoverState.Cancel ? underline(yellow('[Cancel]')) : '[Cancel]'}`"
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
