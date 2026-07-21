import type { Chess } from "chess.js";

// This util function was generated using Gemini 3.1 Pro (High)
// it's pretty weird, but it works
export function getBoardAscii(chessInstance: Chess, isBlack: boolean) {
	const ascii = chessInstance.ascii();
	if (!isBlack) return ascii;

	const lines = ascii.split("\n");

	const boardRows = lines.slice(1, 9);
	boardRows.reverse();

	for (let i = 0; i < boardRows.length; i++) {
		const row = boardRows[i] as string;
		const prefix = row.slice(0, 5);
		const suffix = row.slice(row.length - 2);
		const content = row.slice(5, row.length - 2);
		const reversedContent = content.split("  ").reverse().join("  ");
		boardRows[i] = prefix + reversedContent + suffix;
	}

	const labels = lines[10];
	if (labels) {
		const labelPrefix = labels.slice(0, 5);
		const labelContent = labels.slice(5);
		const reversedLabels = labelContent.split("  ").reverse().join("  ");
		lines[10] = labelPrefix + reversedLabels;
	}

	return [
		lines[0],
		...boardRows,
		lines[9],
		lines[10],
		...lines.slice(11),
	].join("\n");
}
