<script setup lang="ts">
import type { Challenge, FriendRequest } from "@chess-now/api";
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
import ChallengePopup from "../components/ChallengePopup.vue";
import IncomingFriendRequestPopup from "../components/IncomingFriendRequestPopup.vue";
import SendChallengePopup from "../components/SendChallengePopup.vue";
import SidebarComponent from "../components/SidebarComponent.vue";
import { state } from "../store";

type NotificationItem =
	| { type: "challenge"; data: Challenge; id: string; date: Date }
	| { type: "friend_request"; data: FriendRequest; id: string; date: Date };

const yellow = fg("yellow");
const hoverYellow = fg("#FFFF99");
const cyan = fg("cyan");

const currentGlobalFocus = useCurrentFocusedElement();

const hoveredIndex = ref(0);
const scrollOffset = ref(0);
const showChallengePopup = ref(false);
const showSendChallengePopup = ref(false);
const showFriendRequestPopup = ref(false);

const selectedChallenge = ref<Challenge | undefined>(undefined);
const selectedFriendRequest = ref<FriendRequest | undefined>(undefined);

const maxVisible = 10;

const notifications = computed<NotificationItem[]>(() => {
	const items: NotificationItem[] = [];

	const incomingChallenges = state.challenges.filter(
		(c) => c.toId === state.user?.id,
	);
	for (const c of incomingChallenges) {
		items.push({
			type: "challenge",
			data: c,
			id: `challenge-${c.id}`,
			date: new Date(c.createdAt),
		});
	}

	const incomingFriendRequests = state.friendRequests.filter(
		(r) => r.toId === state.user?.id,
	);
	for (const r of incomingFriendRequests) {
		items.push({
			type: "friend_request",
			data: r,
			id: `friend_request-${r.id}`,
			date: new Date(r.createdAt),
		});
	}

	items.sort((a, b) => b.date.getTime() - a.date.getTime());
	return items;
});

const visibleNotifications = computed(() =>
	notifications.value.slice(
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
	if (hoveredIndex.value < notifications.value.length) {
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
		const notification = notifications.value[targetIndex - 1];
		if (notification) {
			if (notification.type === "challenge") {
				selectedChallenge.value = notification.data;
				showChallengePopup.value = true;
			} else if (notification.type === "friend_request") {
				selectedFriendRequest.value = notification.data;
				showFriendRequestPopup.value = true;
			}
		}
	}
}

onKeyDown((key) => {
	if (currentGlobalFocus?.value?.id !== "notifications") return;
	if (showChallengePopup.value) return;
	if (showSendChallengePopup.value) return;
	if (showFriendRequestPopup.value) return;

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
			id="notifications"
			border
			focusable
			:borderColor="currentGlobalFocus?.id === 'notifications' ? '#00FFFFFF' : '#FFFFFF'"
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
					:content="t`${bold('Notifications list')} | ${hoveredIndex}/${notifications.length}`"
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
				:visible="notifications.length === 0"
				flexDirection="column"
				alignItems="center"
				justifyContent="center"
				height="100%"
			>
				<Text :content="t`${bold('No notifications found :C')}`" />
			</Box>
			<Box flexDirection="column" alignItems="flex-start" :flexGrow="1">
				<Box
					v-for="(notification, index) in visibleNotifications"
					:key="notification.id"
					flexDirection="column"
					alignItems="flex-start"
					:marginBottom="1"
				>
					<Text
						v-if="notification.type === 'challenge'"
						:content="t`[Challenge] From: ${notification.data.from?.name ? `${notification.data.from.name} (@${notification.data.from.username})` : 'Unknown'}`"
						:color="yellow"
					/>
					<Text
						v-else-if="notification.type === 'friend_request'"
						:content="t`[Friend Request] From: ${notification.data.from?.name ? `${notification.data.from.name} (@${notification.data.from.username})` : 'Unknown'}`"
						:color="cyan"
					/>

					<Box
						@mouseOver="hoveredIndex = scrollOffset + index + 1"
						@mouseDown="activate(scrollOffset + index + 1)"
					>
						<Text
							:content="t`${(() => {
								const text = notification.type === 'challenge' ? 'View challenge' : 'View request';
								const isHovered = hoveredIndex === scrollOffset + index + 1;

								if (isHovered) {
									return underline(hoverYellow(`[${text}]`));
								}
								return yellow(`[${text}]`);
							})()}`"
						/>
					</Box>
				</Box>
				<Box
					v-if="scrollOffset + visibleNotifications.length < notifications.length"
				>
					<Text
						:content="t`${yellow(`... (${scrollOffset + 1}-${scrollOffset + visibleNotifications.length} of ${notifications.length})`)}`"
					/>
				</Box>
			</Box>
		</Box>
		<ChallengePopup
			:show="showChallengePopup"
			:challenge="selectedChallenge"
			@close="showChallengePopup = false"
		/>
		<IncomingFriendRequestPopup
			:show="showFriendRequestPopup"
			:request="selectedFriendRequest"
			@close="showFriendRequestPopup = false"
		/>
		<SendChallengePopup
			:show="showSendChallengePopup"
			@close="showSendChallengePopup = false"
		/>
	</Box>
</template>
