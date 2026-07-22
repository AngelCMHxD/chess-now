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
							loading="eager"
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
							loading="eager"
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
							loading="eager"
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
							loading="eager"
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
							loading="eager"
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
							loading="eager"
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
							loading="eager"
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
							loading="eager"
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
							loading="eager"
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
							loading="eager"
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
							loading="eager"
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
							loading="eager"
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
