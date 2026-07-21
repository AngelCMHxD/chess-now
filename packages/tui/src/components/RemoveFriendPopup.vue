<script setup lang="ts">
import { RGBA } from "@opentui/core";
import { ref } from "vue";
import { Box, bold, fg, onKeyDown, Text, t, underline } from "vue-termui";
import { chessClient } from "../main";

const props = defineProps<{
	show: boolean;
	friendUsername?: string;
}>();

const emit = defineEmits(["close", "removed"]);

const yellow = fg("yellow");
const red = fg("red");

const loading = ref(false);
const errorMsg = ref("");
enum HoverState {
	Yes = 0,
	No = 1,
}
const hoveredIndex = ref<HoverState>(HoverState.No);

const removeFriend = async () => {
	if (!props.friendUsername) return;
	loading.value = true;
	errorMsg.value = "";
	try {
		await chessClient.removeFriend(props.friendUsername);
		emit("removed");
		emit("close");
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message || "Failed to remove friend";
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
			hoveredIndex.value === HoverState.Yes
				? HoverState.No
				: HoverState.Yes;
	} else if (key.name === "return" || key.name === "enter") {
		if (hoveredIndex.value === HoverState.Yes) {
			removeFriend();
		} else {
			emit("close");
			errorMsg.value = "";
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
		<Text :content="t`${bold('Remove Friend')}`" />
		<Text
			:content="`Are you sure you want to remove @${friendUsername || ''}?`"
			:marginTop="1"
		/>
		<Box flexDirection="row" :marginTop="1" justifyContent="space-around">
			<Box
				@mouseDown="removeFriend"
				@mouseOver="hoveredIndex = HoverState.Yes"
			>
				<Text
					:content="t`${hoveredIndex === HoverState.Yes ? underline(yellow('[Yes]')) : '[Yes]'}`"
				/>
			</Box>
			<Box
				@mouseDown="emit('close')"
				@mouseOver="hoveredIndex = HoverState.No"
				autofocus
			>
				<Text
					:content="t`${hoveredIndex === HoverState.No ? underline(yellow('[No]')) : '[No]'}`"
				/>
			</Box>
		</Box>
		<Text v-if="errorMsg" :content="t`${red(errorMsg)}`" :marginTop="1" />
		<Text
			v-if="loading"
			:content="t`${yellow('Removing...')}`"
			:marginTop="1"
		/>
	</Box>
</template>
