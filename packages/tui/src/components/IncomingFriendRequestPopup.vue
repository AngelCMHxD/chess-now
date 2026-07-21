<script setup lang="ts">
import type { FriendRequest } from "@chess-now/api";
import { RGBA } from "@opentui/core";
import { ref } from "vue";
import { Box, bold, fg, onKeyDown, Text, t, underline } from "vue-termui";
import { chessClient } from "../main";

const props = defineProps<{
	show: boolean;
	request?: FriendRequest;
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

const acceptRequest = async () => {
	if (!props.request?.from?.username) return;
	loading.value = true;
	errorMsg.value = "";
	try {
		await chessClient.acceptFriendRequest(props.request.from.username);
		emit("action");
		emit("close");
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message ||
			"Failed to accept friend request";
	} finally {
		loading.value = false;
	}
};

const rejectRequest = async () => {
	if (!props.request?.from?.username) return;
	loading.value = true;
	errorMsg.value = "";
	try {
		await chessClient.denyFriendRequest(props.request.from.username);
		emit("action");
		emit("close");
	} catch (e: unknown) {
		errorMsg.value =
			(e as { message?: string })?.message ||
			"Failed to reject friend request";
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
			acceptRequest();
		} else {
			rejectRequest();
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
		<Text :content="t`${bold('Friend Request')}`" />
		<Text
			:content="t`From: ${request?.from?.name || 'Unknown'} (@${request?.from?.username || 'Unknown'})`"
			:marginTop="1"
		/>
		<Box flexDirection="row" :marginTop="1" justifyContent="space-around">
			<Box
				@mouseDown="acceptRequest"
				@mouseOver="hoveredIndex = HoverState.Accept"
			>
				<Text
					:content="t`${hoveredIndex === HoverState.Accept ? underline(yellow('[Accept]')) : '[Accept]'}`"
				/>
			</Box>
			<Box
				@mouseDown="rejectRequest"
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
