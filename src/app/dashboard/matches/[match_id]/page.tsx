"use client";

import type { Match } from "@chess-now/api";
import { ChessNowClient } from "@chess-now/api";
import { Chess } from "chess.js";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
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
import { MatchDetailsCard, MatchNotFound } from "./match-components";

export default function SpectateMatchPage({
	params,
}: {
	params: Promise<{ match_id: string }>;
}) {
	const { match_id } = use(params);

	const router = useRouter();

	const [match, setMatch] = useState<Match | null>(null);
	const [loading, setLoading] = useState(true);
	const [client, setClient] = useState<ChessNowClient | null>(null);

	useEffect(() => {
		if (client) return;

		async function init() {
			try {
				const sessionRes = await authClient
					.getSession()
					.catch(() => null);
				const token = sessionRes?.data?.session.token;

				const newClient = new ChessNowClient(
					process.env.NEXT_PUBLIC_BASE_URL as string,
				);

				if (token) {
					newClient.setDefaultToken(token);
				}

				setClient(newClient);

				const matchData = await newClient.getMatch(Number(match_id));
				setMatch(matchData);

				if (
					[matchData.whiteId, matchData.blackId].includes(
						sessionRes?.data?.user?.id || "",
					)
				) {
					router.push(`/dashboard/matches/${match_id}/play`);
				}

				await newClient.connect();

				const currentMatchId = Number(match_id);
				newClient.matchSubscribe(currentMatchId);

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
	}, [match_id, client, router]);

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

	if (loading) {
		return (
			<div className="flex flex-col gap-4 justify-center items-center w-full h-screen">
				<Spinner />
				<p>This might take a while...</p>
			</div>
		);
	}

	if (!match) {
		return <MatchNotFound />;
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
										<BreadcrumbPage>
											Spectate
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
										boardStyle: {
											borderRadius: "10px",
										},
										allowDragging: false,
									}}
								/>
							</div>
							{match && gameInfo && (
								<MatchDetailsCard
									match={match}
									gameInfo={gameInfo}
									onMatchChange={setMatch}
								/>
							)}
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
