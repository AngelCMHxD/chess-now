"use client";

import type { Match, User } from "@chess-now/api";
import { ChessNowClient } from "@chess-now/api";
import { Chess } from "chess.js";
import { use, useEffect, useMemo, useState } from "react";
import type { PieceDropHandlerArgs } from "react-chessboard";
import { AppSidebar } from "@/components/dashboard-sidebar";
import { ThemedChessboard } from "@/components/themed-chessboard";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

											if (match.status !== "active")
												return false;

											const playerColor =
												user?.id ===
												match.whitePlayer.id
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
								/>
							)}
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
