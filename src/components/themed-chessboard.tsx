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
					bP: (params) => (
						<ChessPawnIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-foreground dark:stroke-background p-0.5"
						/>
					),
					wP: (params) => (
						<ChessPawnIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-background dark:stroke-foreground p-0.5"
						/>
					),
					bR: (params) => (
						<ChessRookIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-foreground dark:stroke-background p-0.5"
						/>
					),
					wR: (params) => (
						<ChessRookIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-background dark:stroke-foreground p-0.5"
						/>
					),
					bN: (params) => (
						<ChessKnightIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-foreground dark:stroke-background p-0.5"
						/>
					),
					wN: (params) => (
						<ChessKnightIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-background dark:stroke-foreground p-0.5"
						/>
					),
					bB: (params) => (
						<ChessBishopIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-foreground dark:stroke-background p-0.5"
						/>
					),
					wB: (params) => (
						<ChessBishopIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-background dark:stroke-foreground p-0.5"
						/>
					),
					bQ: (params) => (
						<ChessQueenIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-foreground dark:stroke-background p-0.5"
						/>
					),
					wQ: (params) => (
						<ChessQueenIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-background dark:stroke-foreground p-0.5"
						/>
					),
					bK: (params) => (
						<ChessKingIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-foreground dark:stroke-background p-0.5"
						/>
					),
					wK: (params) => (
						<ChessKingIcon
							width={params?.svgStyle?.width}
							height={params?.svgStyle?.height}
							className="stroke-background dark:stroke-foreground p-0.5"
						/>
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
