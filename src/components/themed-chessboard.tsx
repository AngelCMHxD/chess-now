"use client";
import Image from "next/image";
import { Chessboard } from "react-chessboard";

const commonStyle = {
	width: 256,
	height: 256,
	loading: "eager",
	draggable: false,
	className: "select-none",
} as const;

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
						<Image
							src="/pieces/caliente/BlackPawn.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black Pawn"
							{...commonStyle}
						/>
					),
					wP: (params) => (
						<Image
							src="/pieces/caliente/WhitePawn.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White Pawn"
							{...commonStyle}
						/>
					),
					bR: (params) => (
						<Image
							src="/pieces/caliente/BlackRook.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black Rook"
							{...commonStyle}
						/>
					),
					wR: (params) => (
						<Image
							src="/pieces/caliente/WhiteRook.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White Rook"
							{...commonStyle}
						/>
					),
					bN: (params) => (
						<Image
							src="/pieces/caliente/BlackKnight.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black Knight"
							{...commonStyle}
						/>
					),
					wN: (params) => (
						<Image
							src="/pieces/caliente/WhiteKnight.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White Knight"
							{...commonStyle}
						/>
					),
					bB: (params) => (
						<Image
							src="/pieces/caliente/BlackBishop.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black Bishop"
							{...commonStyle}
						/>
					),
					wB: (params) => (
						<Image
							src="/pieces/caliente/WhiteBishop.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White Bishop"
							{...commonStyle}
						/>
					),
					bQ: (params) => (
						<Image
							src="/pieces/caliente/BlackQueen.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black Queen"
							{...commonStyle}
						/>
					),
					wQ: (params) => (
						<Image
							src="/pieces/caliente/WhiteQueen.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White Queen"
							{...commonStyle}
						/>
					),
					bK: (params) => (
						<Image
							src="/pieces/caliente/BlackKing.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black King"
							{...commonStyle}
						/>
					),
					wK: (params) => (
						<Image
							src="/pieces/caliente/WhiteKing.svg"
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White King"
							unselectable="on"
							{...commonStyle}
						/>
					),
				},
				darkSquareStyle: {
					backgroundColor: "var(--chess-square-dark)",
				},
				lightSquareStyle: {
					backgroundColor: "var(--chess-square-light)",
				},
				...options,
			}}
		/>
	);
}
