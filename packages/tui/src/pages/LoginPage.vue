<script setup lang="ts">
import type { DeviceAuthPayload } from "@chess-now/api";
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
	Box,
	bold,
	fg,
	italic,
	onKeyDown,
	Text,
	t,
	underline,
} from "vue-termui";
import { chessClient } from "../main";
import { state } from "../store";

const router = useRouter();

const cyan = fg("cyan");

const loading = ref<boolean | string>(false);
const authUrl = ref<string | undefined>(undefined);
const hoveredOverLink = ref(false);

function openInBrowser(url: string) {
	const platform = process.platform;
	if (platform === "darwin") {
		Bun.spawn(["open", url]);
	} else if (platform === "linux") {
		Bun.spawn(["xdg-open", url]);
	} else if (platform === "win32") {
		Bun.spawn(["cmd", "/c", "start", url]);
	}
}

onKeyDown(async (key) => {
	if (key.name === "o" && authUrl.value) {
		openInBrowser(authUrl.value);
		return;
	}

	if (key.name === "return" || key.name === "enter") {
		if (loading.value) return;
		loading.value = "Getting auth URL...";

		const deviceAuth = await chessClient.initDeviceAuth([
			"bots",
			"challenges",
			"friends",
			"matches",
		]);

		authUrl.value = deviceAuth.verificationUriComplete;
		loading.value = "Waiting for user auth...";

		const deviceAuthHandler = async (deviceAuthEvent: {
			event: "device_auth";
			payload: DeviceAuthPayload;
		}) => {
			if (deviceAuthEvent.payload.userCode !== deviceAuth.userCode)
				return;

			try {
				if (deviceAuthEvent.payload.action === "denied") {
					throw new Error("Denied");
				}

				if (deviceAuthEvent.payload.action === "expired") {
					throw new Error("Expired");
				}

				loading.value = "Authenticated. Getting user info.";

				const token = await chessClient.getDeviceToken(
					deviceAuth.deviceCode,
				);

				await Bun.secrets.set({
					service: "chess-now-tui",
					name: "access-token",
					value: token.accessToken,
				});
				chessClient.setDefaultToken(token.accessToken);
				const user = await chessClient.getAccountInfo();
				chessClient.subscribe();

				state.user = user;
				await router.replace("/matches");
			} catch (e) {
				console.error(e);
			} finally {
				loading.value = false;
				chessClient.off("device_auth", deviceAuthHandler);
			}
		};

		chessClient.on("device_auth", deviceAuthHandler);
		chessClient.watchDeviceAuth(deviceAuth.userCode, deviceAuth.deviceCode);
	}
});
</script>

<template>
	<Box
		flexDirection="column"
		alignItems="center"
		justifyContent="center"
		width="100%"
		height="100%"
	>
		<Box border :padding="1" flexDirection="column" alignItems="center">
			<Text :content="t`${bold('Chess Now!')}`" />
			<Box
				v-if="loading"
				:marginTop="1"
				flexDirection="column"
				alignItems="center"
			>
				<Text
					:content="t`${italic(loading === true ? 'Loading...' : String(loading))}`"
				/>
				<Box
					v-if="authUrl"
					:marginTop="1"
					flexDirection="column"
					alignItems="center"
				>
					<Text content="Your auth URL is:" />
					<Box
						@mouseOver="hoveredOverLink = true"
						@mouseOut="hoveredOverLink = false"
						@mouseDown="openInBrowser(authUrl)"
					>
						<Text
							:content="t`${hoveredOverLink ? underline(cyan(authUrl)) : cyan(authUrl)}`"
						/>
					</Box>
					<Text
						:content="t`(${bold('Press O to open in browser')})`"
						:color="hoveredOverLink ? 'cyan' : undefined"
					/>
				</Box>
			</Box>
			<Box v-else :marginTop="1" focusable>
				<Text :content="t`${cyan(bold(' Press ENTER to Login '))}`" />
			</Box>
		</Box>
	</Box>
</template>
