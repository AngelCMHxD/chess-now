<script setup lang="ts">
import type { Renderable } from "@opentui/core";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
	Box,
	bold,
	computed,
	fg,
	onKeyDown,
	onMounted,
	shallowRef,
	Text,
	t,
	useCurrentFocusedElement,
	useFocusManager,
} from "vue-termui";
import { chessClient } from "../main";
import { state } from "../store";

const router = useRouter();
const route = useRoute();
const { focused } = useFocusManager();

// focus sidebar by default
onMounted(() => {
	focused.value = el.value as Renderable;
});

const items = [
	{ label: "Matches", path: "/matches" },
	{ label: "Notifications", path: "/notifications" },
	{ label: "Friends", path: "/friends" },
];

const initialIndex = items.findIndex((i) => i.path === route.path);
const selectedIndex = ref(initialIndex >= 0 ? initialIndex : 0);

const cyan = fg("cyan");
const red = fg("red");
const gray = fg("gray");
const silver = fg("silver");

const hoveredIndex = ref<number>(selectedIndex.value);

function selectAndNavigate(index: number) {
	if (index === items.length) {
		state.user = undefined;
		chessClient.setDefaultToken();
		Bun.secrets.delete({
			service: "chess-now-tui",
			name: "access-token",
		});
		router.replace("/login");
		return;
	}

	selectedIndex.value = index;
	router.push((items[index] as (typeof items)[number]).path);
}

const el = shallowRef<unknown>(null);
const currentFocused = useCurrentFocusedElement();
const isFocused = computed(
	() => !!el.value && currentFocused.value === el.value,
);

onKeyDown((key) => {
	if (!isFocused.value) return;

	if (key.name === "up" && hoveredIndex.value > 0) {
		hoveredIndex.value--;
	} else if (key.name === "down" && hoveredIndex.value < items.length) {
		hoveredIndex.value++;
	} else if (key.name === "return" || key.name === "enter") {
		selectedIndex.value = hoveredIndex.value;
		selectAndNavigate(hoveredIndex.value);
	}
});

function setRef(instance?: { $el: unknown }) {
	el.value = instance?.$el ?? instance ?? null;
}
</script>

<template>
	<Box
		:ref="setRef"
		focusable
		flexDirection="column"
		border
		:borderColor="isFocused ? '#00FFFFFF' : '#FFFFFF'"
		:width="25"
		:paddingX="1"
	>
		<Text :content="t`Hello, ${bold(state.user?.name as string)}!`" />
		<Text
			:content="t`${silver(`@${state.user?.username as string}`)}`"
			:marginBottom="1"
		/>

		<Text :content="t`${bold('Sections:')}`" />
		<Box :marginTop="1" flexDirection="column" :gap="1">
			<Box flexDirection="column">
				<Box
					v-for="(item, index) in items"
					:key="item.path"
					width="100%"
					@mouseDown="selectAndNavigate(index)"
					@mouseOver="hoveredIndex = index"
					@mouseOut="hoveredIndex === index ? (hoveredIndex = selectedIndex) : null"
				>
					<Text
						:content="index === selectedIndex
							? t`${cyan(bold(`> ${item.label}`))}`
							: index === hoveredIndex
								? t`${gray(`~ ${item.label}`)}`
								: `  ${item.label}`"
					/>
				</Box>
			</Box>
			<Box
				@mouseOver="hoveredIndex = items.length"
				@mouseOut="hoveredIndex = selectedIndex"
				@mouseDown="selectAndNavigate(items.length)"
			>
				<Text
					:content="selectedIndex === items.length || hoveredIndex === items.length
						? t`${red(bold(`~ Logout`))}`
						: `  Logout`"
				/>
			</Box>
		</Box>
	</Box>
</template>
