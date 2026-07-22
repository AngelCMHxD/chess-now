"use client";

import type { Match, User } from "@chess-now/api";
import { ChessNowClient } from "@chess-now/api";
import { Chess } from "chess.js";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import type { PieceDropHandlerArgs } from "react-chessboard";
import { ThemedChessboard } from "@/components/themed-chessboard";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";
import { cn, formatMiliseconds } from "@/lib/utils";

export default function PlayMatchPage({
	params,
}: {
	params: Promise<{ match_id: string }>;
}) {
	const { match_id } = use(params);

	const [user, setUser] = useState<User | null>(null);
	const [match, setMatch] = useState<Match | null>(null);
	const [loading, setLoading] = useState(true);
	const [client, setClient] = useState<ChessNowClient | null>(null);

	useEffect(() => {
		if (client) return;

		async function init() {
			try {
				const sessionRes = await authClient.getSession();
				const token = sessionRes.data?.session.token;
				if (!token) return;

				const newClient = new ChessNowClient(
					process.env.NEXT_PUBLIC_BASE_URL as string,
				);
				newClient.setDefaultToken(token);
				setClient(newClient);

				const [userData, matchData] = await Promise.all([
					newClient.getAccountInfo(token),
					newClient.getMatch(Number(match_id), token),
				]);

				setUser(userData);
				setMatch(matchData);

				await newClient.connect();
				newClient.subscribe(["match"]);

				const currentMatchId = Number(match_id);

				newClient.on("match:board_move", (event) => {
					if (event.payload.match.id === currentMatchId) {
						setMatch(event.payload.match);
					}
				});

				newClient.on("match:game_over", (event) => {
					if (event.payload.match.id === currentMatchId) {
						setMatch((prev) =>
							prev
								? {
										...prev,
										endReason:
											event.payload.match.endReason,
										finishedAt:
											event.payload.match.finishedAt,
										status: event.payload.match.status,
									}
								: prev,
						);
					}
				});
			} catch (error) {
				console.error("Error fetching match data:", error);
			} finally {
				setLoading(false);
			}
		}

		init();
	}, [match_id, client]);

	const gameInfo = useMemo(() => {
		if (!match) return null;

		let turn: "w" | "b" | null = null;
		let moves: string[] = [];
		let capturedByWhite: string[] = [];
		let capturedByBlack: string[] = [];

		try {
			turn = new Chess(match.fen).turn();
		} catch {}

		if (match.pgn.trim()) {
			try {
				const chess = new Chess();
				chess.loadPgn(match.pgn);
				const history = chess.history({ verbose: true });

				moves = history.map((m) => m.san);
				capturedByWhite = history.flatMap((m) =>
					m.color === "w" && m.captured ? [m.captured] : [],
				);
				capturedByBlack = history.flatMap((m) =>
					m.color === "b" && m.captured ? [m.captured] : [],
				);
			} catch {}
		}

		return { turn, moves, capturedByWhite, capturedByBlack };
	}, [match]);

	function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
		if (!targetSquare || !match) {
			return false;
		}

		const chessGame = new Chess();
		chessGame.loadPgn(match.pgn);

		try {
			const move = chessGame.move({
				from: sourceSquare,
				to: targetSquare,
				promotion: "q",
			});

			setMatch({
				...match,
				fen: chessGame.fen(),
				pgn: chessGame.pgn(),
			});

			try {
				async function sendMove() {
					if (!client || !match) return false;
					const { match: updatedMatch } = await client.makeMove(
						match.id,
						move.lan,
					);

					if (chessGame.isGameOver()) return;
					setMatch(updatedMatch);
				}

				sendMove();
			} catch {
				return false;
			}

			return true;
		} catch {
			return false;
		}
	}

	if (loading) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (!match || !user) {
		return (
			<AlertDialog defaultOpen={true}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Match Not Found</AlertDialogTitle>
						<AlertDialogDescription>
							Couldn't find the match. It may not exist or be an
							error on our side :C
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<Link href="/account/dashboard">
							<AlertDialogAction>
								Return to Dashboard
							</AlertDialogAction>
						</Link>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	}

	if (user.id !== match.whiteId && user.id !== match.blackId) {
		return (
			<AlertDialog defaultOpen={true}>
				<AlertDialogContent className="sm:max-w-[425px]">
					<AlertDialogHeader>
						<AlertDialogTitle>Access Denied</AlertDialogTitle>
						<AlertDialogDescription>
							You are not a player in this match.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<Link href="/account/dashboard">
							<AlertDialogAction>
								Return to Dashboard
							</AlertDialogAction>
						</Link>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	}

	return (
		<div className="flex min-h-screen flex-col md:h-screen md:overflow-hidden">
			<header className="flex h-16 shrink-0 items-center gap-2">
				<div className="flex items-center gap-2 px-4">
					<Separator
						orientation="vertical"
						className="mr-2 data-[orientation=vertical]:h-4"
					/>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbPage>Play</BreadcrumbPage>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>
									Match {match_id}
								</BreadcrumbPage>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>
									<span className="font-bold">
										{match?.whitePlayer.name}
									</span>{" "}
									vs.{" "}
									<span className="font-bold">
										{match?.blackPlayer.name}
									</span>
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			<div className="m-4 flex flex-1 flex-col rounded-xl bg-muted/50 p-4 md:p-8 md:overflow-hidden md:min-h-0">
				<div className="grid h-full w-full grid-cols-1 items-center gap-8 md:grid-cols-2">
					<div className="w-[75vh] max-h-full max-w-full justify-self-center md:justify-self-end">
						<ThemedChessboard
							options={{
								position: match?.fen,
								boardOrientation:
									match?.whitePlayer.id === user?.id
										? "white"
										: "black",
								boardStyle: {
									borderRadius: "10px",
								},
								onPieceDrop,
								canDragPiece: ({ piece }) => {
									if (!match) return false;

									if (match.status !== "active") return false;

									const playerColor =
										user?.id === match.whitePlayer.id
											? "w"
											: "b";

									if (piece.pieceType[0] !== playerColor)
										return false;

									const chessGame = new Chess(match.fen);
									if (chessGame.turn() !== playerColor)
										return false;

									return true;
								},
							}}
						/>
					</div>
					{match && gameInfo && (
						<MatchDetailsCard
							match={match}
							user={user}
							gameInfo={gameInfo}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

interface GameInfo {
	turn: "w" | "b" | null;
	moves: string[];
	capturedByWhite: string[];
	capturedByBlack: string[];
}

function MatchDetailsCard({
	match,
	user,
	gameInfo,
}: {
	match: Match;
	user: User | null;
	gameInfo: GameInfo;
}) {
	return (
		<TooltipProvider>
			<Card className="w-full max-w-2xl flex flex-col max-h-full">
				<CardHeader className="shrink-0">
					<div>
						<div className="flex gap-2">
							<CardTitle>Match #{match.id}</CardTitle>
							<Badge
								variant={
									match.status === "active"
										? "default"
										: "secondary"
								}
								className="capitalize"
							>
								{match.status.replaceAll("_", " ")}
							</Badge>
						</div>
						<CardDescription>
							<MatchDuration match={match} />
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent className="flex flex-col gap-4 min-h-0">
					<div className="flex flex-col gap-3">
						<PlayerRow
							player={match.whitePlayer}
							color="w"
							gameInfo={gameInfo}
							isUser={user?.id === match.whiteId}
						/>
						<Separator />
						<PlayerRow
							player={match.blackPlayer}
							color="b"
							gameInfo={gameInfo}
							isUser={user?.id === match.blackId}
						/>
					</div>

					<Separator />
					<MoveHistory moves={gameInfo.moves} />

					{match.status !== "active" && <MatchResult match={match} />}
				</CardContent>
			</Card>
		</TooltipProvider>
	);
}

function PlayerRow({
	player,
	color,
	gameInfo,
	isUser,
}: {
	player: User;
	color: "w" | "b";
	gameInfo: GameInfo;
	isUser: boolean;
}) {
	return (
		<div className="flex items-center gap-3 justify-between">
			<div
				className={cn(
					"flex items-center gap-2 p-2",
					gameInfo.turn === color && "bg-primary/40 rounded-lg",
				)}
			>
				<span
					className={cn(
						"size-4 rounded-full border-2",
						color === "w" ? "bg-[#F8F8F8]" : "bg-[#333130]",
					)}
				/>
				<div>
					<p className="font-medium">{player.name}</p>
					<p className="text-xs text-muted-foreground">
						{color === "w" ? "White" : "Black"}
						{isUser ? " - You" : ""}
					</p>
				</div>
			</div>
			<CapturedPieces
				captured={
					color === "w"
						? gameInfo.capturedByWhite
						: gameInfo.capturedByBlack
				}
				color={color}
			/>
		</div>
	);
}

function CapturedPieces({
	captured,
	color,
}: {
	captured: string[];
	color: "w" | "b";
}) {
	const nameMap: Record<string, string> = {
		p: "Pawn",
		n: "Knight",
		b: "Bishop",
		r: "Rook",
		q: "Queen",
		k: "King",
	};

	const piecesCaptured: Record<string, number> = {};
	for (const piece of captured) {
		piecesCaptured[piece] = (piecesCaptured[piece] || 0) + 1;
	}

	return (
		<div className="flex gap-1">
			{Object.keys(piecesCaptured).map((piece) => {
				const pieceName = nameMap[piece];

				// the captured pieces are from the opponent
				const pieceColorPrefix = color === "w" ? "Black" : "White";
				const imgSrc = `/pieces/caliente/${pieceColorPrefix}${pieceName}.svg`;

				return (
					<Tooltip key={piece}>
						<TooltipTrigger asChild>
							<div className="flex items-center gap-1 rounded border bg-muted p-1 pr-2">
								<Image
									src={imgSrc}
									alt={`${pieceColorPrefix} ${pieceName}`}
									width={20}
									height={20}
									className="size-5"
									loading="eager"
								/>
								<span className="text-xs font-bold">
									x{piecesCaptured[piece]}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p className="font-medium">
								{nameMap[piece]} (x{piecesCaptured[piece]})
							</p>
						</TooltipContent>
					</Tooltip>
				);
			})}
		</div>
	);
}

function MoveHistory({ moves }: { moves: string[] }) {
	const turns = [];

	for (let i = 0; i < moves.length; i += 2) {
		turns.push(moves.slice(i, i + 2));
	}

	return (
		<div className="flex flex-col gap-1 flex-1 min-h-0">
			<p className="text-sm font-semibold shrink-0">Move history</p>
			<div className="flex-1 overflow-y-auto rounded-md bg-background">
				{moves.length > 0 ? (
					<div className="flex flex-col gap-4 p-4">
						{turns.map((turn, index) => (
							<div
								key={index}
								className="grid grid-cols-2 border-b"
							>
								<div className="flex gap-2">
									<p className="text-muted-foreground">
										{index + 1}.
									</p>
									<p>{turn[0]}</p>
								</div>
								<p>{turn[1] ?? "..."}</p>
							</div>
						))}
					</div>
				) : (
					<p className="p-3 text-sm text-muted-foreground">
						No moves played yet.
					</p>
				)}
			</div>
		</div>
	);
}

function MatchResult({ match }: { match: Match }) {
	return (
		<div className="rounded-md bg-muted p-3">
			<p>
				<span className="font-bold">Result: </span>
				{match.status === "white_won"
					? `${match.whitePlayer.name} won`
					: match.status === "black_won"
						? `${match.blackPlayer.name} won`
						: "Draw"}
			</p>
			{match.endReason && (
				<p className="capitalize text-muted-foreground">
					{match.endReason.replaceAll("-", " ")}
				</p>
			)}
		</div>
	);
}

function MatchDuration({ match }: { match: Match }) {
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		if (match.status !== "active") return;

		const interval = setInterval(() => {
			setNow(Date.now());
		}, 1000);

		return () => clearInterval(interval);
	}, [match.status]);

	const elapsed = Math.max(
		0,
		match.status === "active"
			? now - new Date(match.createdAt).getTime()
			: new Date(match.finishedAt || match.createdAt).getTime() -
					new Date(match.createdAt).getTime(),
	);

	if (match.status === "active")
		return <p>Started {formatMiliseconds(elapsed)} ago</p>;

	return <p>Lasted {formatMiliseconds(elapsed)}</p>;
}
