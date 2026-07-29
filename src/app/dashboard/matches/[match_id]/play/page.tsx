"use client";

import type { Match, User } from "@chess-now/api";
import { ChessNowClient } from "@chess-now/api";
import { Chess, type Square } from "chess.js";
import Image from "next/image";
import { use, useEffect, useMemo, useState } from "react";
import type { PieceDropHandlerArgs } from "react-chessboard";
import { AppSidebar } from "@/components/dashboard-sidebar";
import { ThemedChessboard } from "@/components/themed-chessboard";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import {
	MatchDetailsCard,
	MatchNotFound,
	NotPlayer,
} from "../match-components";
import { toast } from "sonner";

type PromotionMoveState = {
	sourceSquare: string;
	targetSquare: string;
};

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
	const [promotionMove, setPromotionMove] =
		useState<PromotionMoveState | null>(null);

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

				newClient.on("match:draw_request", (event) => {
					if (event.payload.match.id === currentMatchId) {
						setMatch(event.payload.match);
					}
				});

				newClient.on("match:draw_deny", (event) => {
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
										whiteRatingDiff:
											event.payload.match.whiteRatingDiff,
										blackRatingDiff:
											event.payload.match.blackRatingDiff,
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

	async function executeMove(from: string, to: string, promotion?: string) {
		if (!client || !match || from === to) return false;

		const chessGame = new Chess();
		if (match.pgn.trim()) {
			chessGame.loadPgn(match.pgn);
		} else {
			chessGame.load(match.fen);
		}

		try {
			const move = chessGame.move({
				from,
				to,
				promotion: promotion || undefined,
			});

			setMatch({
				...match,
				fen: chessGame.fen(),
				pgn: chessGame.pgn(),
			});

			try {
				const { match: updatedMatch } = await client.makeMove(
					match.id,
					move.lan,
				);

				if (!chessGame.isGameOver()) {
					setMatch(updatedMatch);
				}
			} catch (err) {
				console.error("Failed to make move:", err);
				return false;
			}

			return true;
		} catch {
			toast.error(`Invalid move!`, {
				duration: 2000,
			});
			return false;
		}
	}

	function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
		if (!targetSquare || !match || !user) {
			return false;
		}

		const chessGame = new Chess();
		if (match.pgn.trim()) {
			chessGame.loadPgn(match.pgn);
		} else {
			chessGame.load(match.fen);
		}

		const possibleMoves = chessGame.moves({
			square: sourceSquare as Square,
			verbose: true,
		});

		const isPromotion = possibleMoves.some(
			(m) => m.to === targetSquare && m.isPromotion(),
		);

		if (isPromotion) {
			setPromotionMove({ sourceSquare, targetSquare });
			return true;
		}

		executeMove(sourceSquare, targetSquare);
		return true;
	}

	function handlePromotionSelect(piece: "q" | "r" | "n" | "b") {
		if (!promotionMove) return;
		const { sourceSquare, targetSquare } = promotionMove;
		setPromotionMove(null);
		executeMove(sourceSquare, targetSquare, piece);
	}

	if (loading) {
		return (
			<div className="flex flex-col gap-4 justify-center items-center w-full h-screen">
				<Spinner />
				<p>This might take a while...</p>
			</div>
		);
	}

	if (!match || !user) {
		return <MatchNotFound />;
	}

	if (user.id !== match.whiteId && user.id !== match.blackId) {
		return <NotPlayer matchId={match.id} />;
	}

	const isWhite = match.whitePlayer.id === user.id;

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<div className="flex min-h-screen flex-col md:h-screen md:overflow-hidden">
					<header className="flex h-16 shrink-0 items-center gap-2">
						<div className="flex items-center gap-2 px-4">
							<SidebarTrigger className="-ml-1" />
							<Separator
								orientation="vertical"
								className="mr-2 data-[orientation=vertical]:h-4"
							/>
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbItem>
										<BreadcrumbPage
											href="/dashboard"
											className="text-foreground/65 hover:text-foreground/75 hover:underline"
										>
											Dashboard
										</BreadcrumbPage>
									</BreadcrumbItem>
									<BreadcrumbSeparator />
									<BreadcrumbItem>
										<BreadcrumbPage
											href="/dashboard/matches"
											className="text-foreground/65 hover:text-foreground/75 hover:underline"
										>
											Matches
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
									<BreadcrumbSeparator />
									<BreadcrumbItem>
										<BreadcrumbPage>Play</BreadcrumbPage>
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
										boardOrientation: isWhite
											? "white"
											: "black",
										boardStyle: {
											borderRadius: "10px",
										},
										onPieceDrop,
										canDragPiece: ({ piece }) => {
											if (!match) return false;

											if (match.status !== "active")
												return false;

											const playerColor = isWhite
												? "w"
												: "b";

											if (
												piece.pieceType[0] !==
												playerColor
											)
												return false;

											const chessGame = new Chess(
												match.fen,
											);
											if (
												chessGame.turn() !== playerColor
											)
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
									client={client}
									onMatchChange={setMatch}
								/>
							)}
						</div>
					</div>
				</div>

				<AlertDialog
					open={!!promotionMove}
					onOpenChange={(open) => {
						if (!open) setPromotionMove(null);
					}}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Pawn Promotion</AlertDialogTitle>
							<AlertDialogDescription>
								Select a piece to promote your pawn to
							</AlertDialogDescription>
						</AlertDialogHeader>
						<div className="grid grid-cols-4 gap-2">
							{(["q", "r", "n", "b"] as const).map((piece) => {
								const colorPrefix = isWhite ? "White" : "Black";
								const pieceNames = {
									q: "Queen",
									r: "Rook",
									n: "Knight",
									b: "Bishop",
								};
								const svgName = `${colorPrefix}${pieceNames[piece]}.svg`;

								return (
									<Button
										key={piece}
										variant="outline"
										onClick={() =>
											handlePromotionSelect(piece)
										}
										className="h-20 flex-col gap-1"
									>
										<Image
											src={`/pieces/caliente/${svgName}`}
											alt={pieceNames[piece]}
											width={40}
											height={40}
										/>
										<span className="text-xs">
											{pieceNames[piece]}
										</span>
									</Button>
								);
							})}
						</div>
					</AlertDialogContent>
				</AlertDialog>
			</SidebarInset>
		</SidebarProvider>
	);
}
