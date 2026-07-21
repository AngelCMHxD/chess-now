<script setup lang="ts">
import { Box, bold, italic, Text, t } from "vue-termui";
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
			<Box :marginTop="1" flexDirection="column" alignItems="center">
				<Text :content="t`${italic('Loading...')}`" />
			</Box>
		</Box>
	</Box>
</template>
