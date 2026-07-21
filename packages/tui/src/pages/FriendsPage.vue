<script setup lang="ts">
import {
	Box,
	bold,
	computed,
	fg,
	onKeyDown,
	ref,
	Text,
	t,
	underline,
	useCurrentFocusedElement,
} from "vue-termui";
import FriendRequestPopup from "../components/FriendRequestPopup.vue";
import RemoveFriendPopup from "../components/RemoveFriendPopup.vue";
import SidebarComponent from "../components/SidebarComponent.vue";
import { state } from "../store";

const yellow = fg("yellow");
const hoverYellow = fg("#FFFF99");

const currentGlobalFocus = useCurrentFocusedElement();

const hoveredIndex = ref(0);
const scrollOffset = ref(0);
const showFriendRequestPopup = ref(false);
const showRemoveFriendPopup = ref(false);
const selectedFriendUsername = ref("");
const maxVisible = 13;

const visibleFriends = computed(() =>
	state.friends.slice(scrollOffset.value, scrollOffset.value + maxVisible),
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
	if (hoveredIndex.value < state.friends.length) {
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
		showFriendRequestPopup.value = true;
	} else {
		const friend = state.friends[targetIndex - 1];
		if (friend) {
			selectedFriendUsername.value =
				friend.userAId === state.user?.id
					? friend.userB?.username || ""
					: friend.userA?.username || "";
			showRemoveFriendPopup.value = true;
		}
	}
}

onKeyDown((key) => {
	if (currentGlobalFocus?.value?.id !== "friends") return;
	if (showFriendRequestPopup.value || showRemoveFriendPopup.value) return;

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
			id="friends"
			border
			focusable
			:borderColor="currentGlobalFocus?.id === 'friends' ? '#00FFFFFF' : '#FFFFFF'"
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
					:content="t`${bold('Friend list')} | ${hoveredIndex}/${state.friends.length}`"
				/>
				<Box
					id="addFriend"
					@mouseOver="hoveredIndex = 0"
					@mouseDown="activate(0)"
				>
					<Text
						:content="t`${
							hoveredIndex === 0
								? underline(hoverYellow('[Add friend]'))
								: yellow('[Add friend]')
						}`"
					/>
				</Box>
			</Box>

			<Box
				:visible="state.friends.length === 0"
				flexDirection="column"
				alignItems="center"
				justifyContent="center"
				height="100%"
			>
				<Text :content="t`${bold('No friends found :C')}`" />
			</Box>
			<Box flexDirection="column" alignItems="flex-start" :flexGrow="1">
				<Box
					v-for="(friend, index) in visibleFriends"
					:key="friend.id"
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
								const text = 'Remove friend';
								const isHovered = hoveredIndex === scrollOffset + index + 1;

								if (isHovered) {
									return underline(hoverYellow(`[${text}]`));
								}
								return yellow(`[${text}]`);
							})()}`"
						/>
					</Box>
					<Text
						:content="t`${friend.userAId === state.user?.id ? friend.userB?.name : friend.userA?.name} (@${friend.userAId === state.user?.id ? friend.userB?.username : friend.userA?.username})`"
					/>
				</Box>
				<Box
					v-if="scrollOffset + visibleFriends.length < state.friends.length"
					:marginTop="1"
				>
					<Text
						:content="t`${yellow(`... (${scrollOffset + 1}-${scrollOffset + visibleFriends.length} of ${state.friends.length})`)}`"
					/>
				</Box>
			</Box>
		</Box>
		<FriendRequestPopup
			:show="showFriendRequestPopup"
			@close="showFriendRequestPopup = false"
		/>
		<RemoveFriendPopup
			:show="showRemoveFriendPopup"
			:friendUsername="selectedFriendUsername"
			@close="showRemoveFriendPopup = false"
		/>
	</Box>
</template>
