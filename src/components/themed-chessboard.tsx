"use client";
import Image from "next/image";
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
						<Image
							src="/pieces/caliente/BlackPawn.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black Pawn"
						/>
					),
					wP: (params) => (
						<Image
							src="/pieces/caliente/WhitePawn.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White Pawn"
						/>
					),
					bR: (params) => (
						<Image
							src="/pieces/caliente/BlackRook.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black Rook"
						/>
					),
					wR: (params) => (
						<Image
							src="/pieces/caliente/WhiteRook.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White Rook"
						/>
					),
					bN: (params) => (
						<Image
							src="/pieces/caliente/BlackKnight.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black Knight"
						/>
					),
					wN: (params) => (
						<Image
							src="/pieces/caliente/WhiteKnight.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White Knight"
						/>
					),
					bB: (params) => (
						<Image
							src="/pieces/caliente/BlackBishop.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black Bishop"
						/>
					),
					wB: (params) => (
						<Image
							src="/pieces/caliente/WhiteBishop.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White Bishop"
						/>
					),
					bQ: (params) => (
						<Image
							src="/pieces/caliente/BlackQueen.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black Queen"
						/>
					),
					wQ: (params) => (
						<Image
							src="/pieces/caliente/WhiteQueen.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White Queen"
						/>
					),
					bK: (params) => (
						<Image
							src="/pieces/caliente/BlackKing.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="Black King"
						/>
					),
					wK: (params) => (
						<Image
							src="/pieces/caliente/WhiteKing.svg"
							width={256}
							height={256}
							style={{
								width: params?.svgStyle?.width,
								height: params?.svgStyle?.height,
							}}
							alt="White King"
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
