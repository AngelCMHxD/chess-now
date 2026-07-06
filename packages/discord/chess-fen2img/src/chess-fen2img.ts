import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import {
	black,
	cols,
	defaultDark,
	defaultHighlight,
	defaultLight,
	defaultPadding,
	defaultSize,
	defaultStyle,
	filePaths,
	type PieceStyle,
	white,
} from "./config/index";

export interface Options {
	size?: number;
	padding?: [number, number, number, number];
	light?: string;
	dark?: string;
	highlight?: string;
	style?: PieceStyle;
	flipped?: boolean;
	notations?: boolean;
}

type BoardArray = string[][];

type LoadedPiece = {
	type: PieceSymbol;
	color: "w" | "b";
};

export default class ChessImageGenerator {
	public chess = new Chess();
	public highlightedSquares: string[] = [];
	public size: number;
	public padding: [number, number, number, number];
	public light: string;
	public dark: string;
	public highlight: string;
	public style: PieceStyle;
	public flipped: boolean;
	public notations: boolean;
	public ready = false;

	public constructor(options: Options = {}) {
		this.size = options.size ?? defaultSize;
		this.padding = options.padding ?? [...defaultPadding];
		this.light = options.light ?? defaultLight;
		this.dark = options.dark ?? defaultDark;
		this.highlight = options.highlight ?? defaultHighlight;
		this.style = options.style ?? defaultStyle;
		this.flipped = options.flipped ?? false;
		this.notations = options.notations ?? false;
	}

	public async loadPGN(pgn: string): Promise<void> {
		this.chess.loadPgn(pgn);
		this.ready = true;
	}

	public async loadFEN(fen: string): Promise<void> {
		this.chess.load(fen);
		this.ready = true;
	}

	public loadArray(array: BoardArray): void {
		this.chess.clear();

		for (const [i, rank] of array.entries()) {
			for (const [j, square] of rank.entries()) {
				if (square !== "" && black.includes(square.toLowerCase())) {
					this.chess.put(
						{
							type: square.toLowerCase() as PieceSymbol,
							color: white.includes(square) ? "w" : "b",
						},
						`${cols[j]}${8 - i}` as Square,
					);
				}
			}
		}

		this.ready = true;
	}

	public highlightSquares(array: string[]): void {
		this.highlightedSquares = array;
	}

	public async generateBuffer(): Promise<Buffer> {
		if (!this.ready) {
			throw new Error("Load a position first");
		}

		const canvas = createCanvas(
			this.size + this.padding[1] + this.padding[3],
			this.size + this.padding[0] + this.padding[2],
		);
		const ctx = canvas.getContext("2d");

		ctx.beginPath();
		ctx.rect(
			0,
			0,
			this.size + this.padding[1] + this.padding[3],
			this.size + this.padding[0] + this.padding[2],
		);
		ctx.fillStyle = this.light;
		ctx.fill();

		const row = this.flipped ? (r: number) => r + 1 : (r: number) => 8 - r;
		const col = this.flipped ? (c: number) => c : (c: number) => 7 - c;

		for (let i = 0; i < 8; i += 1) {
			for (let j = 0; j < 8; j += 1) {
				const coords = `${cols[col(j)]}${row(i)}` as Square;
				const x = (this.size / 8) * j + this.padding[3];
				const y = (this.size / 8) * i + this.padding[0];

				if ((i + j) % 2 === 0) {
					ctx.beginPath();
					ctx.rect(x, y, this.size / 8, this.size / 8);
					ctx.fillStyle = this.dark;
					ctx.fill();
				}

				if (this.highlightedSquares.includes(coords)) {
					ctx.beginPath();
					ctx.rect(x, y, this.size / 8, this.size / 8);
					ctx.fillStyle = this.highlight;
					ctx.fill();
				}

				const piece = this.chess.get(coords) as LoadedPiece | null;

				if (piece && black.includes(piece.type.toLowerCase())) {
					const imagePath = path.join(
						import.meta.dir,
						`resources/${this.style}/${filePaths[`${piece.color}${piece.type}` as keyof typeof filePaths]}.png`,
					);
					const image = await loadImage(imagePath);
					ctx.drawImage(image, x, y, this.size / 8, this.size / 8);
				}
			}
		}

		if (
			this.notations &&
			this.padding.every(
				(value, index) => value === defaultPadding[index],
			)
		) {
			const notationPath = path.join(
				import.meta.dir,
				this.flipped
					? "resources/BlackPovNotations.png"
					: "resources/WhitePovNotations.png",
			);
			const notationImage = await loadImage(notationPath);
			ctx.globalAlpha = 0.4;
			ctx.drawImage(notationImage, 0, 0, this.size, this.size);
			ctx.globalAlpha = 1;
		}

		return canvas.toBuffer("image/png");
	}

	public async generatePNG(pngPath: string): Promise<void> {
		if (!this.ready) {
			throw new Error("Load a position first");
		}

		const buffer = await this.generateBuffer();
		await writeFile(pngPath, buffer);
	}
}
