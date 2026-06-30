"use client";
import {
	ChessBishopIcon,
	ChessKingIcon,
	ChessKnightIcon,
	ChessPawnIcon,
	ChessQueenIcon,
	ChessRookIcon,
} from "lucide-react";
import { Chessboard } from "react-chessboard";

export function ThemedChessboard({
	options,
}: {
	options: Parameters<typeof Chessboard>[0]["options"];
}) {
	return (
		<Chessboard
			options={{
				pieces: {
					bP: () => (
						<ChessPawnIcon className="stroke-foreground dark:stroke-background p-0.5" />
					),
					wP: () => (
						<ChessPawnIcon className="stroke-background dark:stroke-foreground p-0.5" />
					),
					bR: () => (
						<ChessRookIcon className="stroke-foreground dark:stroke-background p-0.5" />
					),
					wR: () => (
						<ChessRookIcon className="stroke-background dark:stroke-foreground p-0.5" />
					),
					bN: () => (
						<ChessKnightIcon className="stroke-foreground dark:stroke-background p-0.5" />
					),
					wN: () => (
						<ChessKnightIcon className="stroke-background dark:stroke-foreground p-0.5" />
					),
					bB: () => (
						<ChessBishopIcon className="stroke-foreground dark:stroke-background p-0.5" />
					),
					wB: () => (
						<ChessBishopIcon className="stroke-background dark:stroke-foreground p-0.5" />
					),
					bQ: () => (
						<ChessQueenIcon className="stroke-foreground dark:stroke-background p-0.5" />
					),
					wQ: () => (
						<ChessQueenIcon className="stroke-background dark:stroke-foreground p-0.5" />
					),
					bK: () => (
						<ChessKingIcon className="stroke-foreground dark:stroke-background p-0.5" />
					),
					wK: () => (
						<ChessKingIcon className="stroke-background dark:stroke-foreground p-0.5" />
					),
				},
				darkSquareStyle: {
					backgroundColor: "var(--chart-5)",
				},
				lightSquareStyle: {
					backgroundColor: "var(--chart-3)",
				},
				...options,
			}}
		/>
	);
}
