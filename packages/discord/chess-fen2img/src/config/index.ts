export const cols = "abcdefgh";

export const white = "PBNRQK";

export const black = "pbnrqk";

export const defaultSize = 480;

export const defaultPadding = [0, 0, 0, 0] as const;

export const defaultLight = "rgb(240, 217, 181)";

export const defaultDark = "rgb(181, 136, 99)";

export const defaultHighlight = "rgba(235, 97, 80, 0.8)";

export const defaultStyle = "caliente" as const;

export const filePaths = {
	wp: "WhitePawn",
	bp: "BlackPawn",
	wb: "WhiteBishop",
	bb: "BlackBishop",
	wn: "WhiteKnight",
	bn: "BlackKnight",
	wr: "WhiteRook",
	br: "BlackRook",
	wq: "WhiteQueen",
	bq: "BlackQueen",
	wk: "WhiteKing",
	bk: "BlackKing",
} as const;

export type PieceStyle = "caliente";
