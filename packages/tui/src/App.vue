<script setup lang="ts">
import { RouterView } from "vue-router";
import { Box, onKeyDown, useExit, useFocusManager } from "vue-termui";
import { chessClient } from "./main";
import { router } from "./router";

const exit = useExit();
const { focusNext, focusPrevious } = useFocusManager();

onKeyDown((key) => {
	if (key.option && key.name === "q") {
		chessClient.disconnect();
		exit();
	}

	if (key.option && key.name === "left") {
		router.back();
	}

	if (key.option && key.name === "right") {
		router.forward();
	}

	if (key.name === "tab") {
		key.preventDefault();
		key.shift ? focusPrevious() : focusNext();
	}
});
</script>

<template>
	<Box flexDirection="row" :gap="1" :padding="1">
		<Box :flexGrow="1">
			<RouterView />
		</Box>
	</Box>
</template>
