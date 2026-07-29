import type { Match, User } from "@chess-now/api";
import Link from "next/link";
import { memo, useMemo } from "react";
import { ThemedChessboard } from "@/components/themed-chessboard";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatMiliseconds } from "@/lib/utils";

function MatchCardComponent({
	match,
	user,
}: {
	match: Match;
	user: User | null;
}) {
	let ratingDiff: number | null = null;
	if (match.status !== "active" && user) {
		if (user.id === match.whitePlayer.id) {
			ratingDiff = match.whiteRatingDiff;
		} else if (user.id === match.blackPlayer.id) {
			ratingDiff = match.blackRatingDiff;
		}
	}

	let ratingDiffColor = "font-bold";
	let ratingDiffText = "0";

	if (ratingDiff !== null) {
		if (ratingDiff > 0) {
			ratingDiffColor = "text-emerald-500/80 font-bold";
			ratingDiffText = `+${ratingDiff}`;
		} else if (ratingDiff < 0) {
			ratingDiffColor = "text-rose-500/80 font-bold";
			ratingDiffText = `${ratingDiff}`;
		}
	}

	const boardOrientation =
		match.whitePlayer.id === user?.id ? "white" : "black";

	const chessboardOptions = useMemo(
		() =>
			({
				allowDragging: false,
				position: match.fen,
				showNotation: false,
				boardOrientation,
			}) as const,
		[match.fen, boardOrientation],
	);

	return (
		<Card size="default" className="w-full overflow-hidden p-0 gap-0">
			<div className="flex flex-col xl:flex-row h-full">
				<div className="flex flex-col justify-between w-full">
					<CardHeader>
						<CardTitle className="pt-4">
							vs.{" "}
							{user?.id === match.whitePlayer.id
								? `${match.blackPlayer.name} (@${match.blackPlayer.username})`
								: `${match.whitePlayer.name} (@${match.whitePlayer.username})`}
						</CardTitle>
						<CardDescription>
							{match.status === "active" ? (
								<p>
									Started at:{" "}
									{new Date(match.createdAt).toLocaleString()}
									<br />
									Active
								</p>
							) : (
								<p>
									Duration:{" "}
									{formatMiliseconds(
										(match.finishedAt
											? new Date(
													match.finishedAt,
												).getTime()
											: 0) -
											new Date(match.createdAt).getTime(),
									)}
									<br />
									{match.endReason === "checkmate"
										? `Winner: ${(() => {
												const winner =
													match.status === "white_won"
														? match.whitePlayer
														: match.blackPlayer;

												if (winner.id === user?.id) {
													return "You";
												}

												return winner.name;
											})()}`
										: `Draw: ${(() => {
												switch (match.endReason) {
													case "50-moves":
														return "50 Moves";
													case "insufficient-material":
														return "Insufficient Material";
													case "draw":
														return "Draw";
													case "stalemate":
														return "Stalemate";
													case "forfeit":
														return "Forfeit";
													default:
														return "Unknown";
												}
											})()}`}
									{ratingDiff !== null && (
										<>
											<br />
											ELO Diff:{" "}
											<span className={ratingDiffColor}>
												{ratingDiffText}
											</span>
										</>
									)}
								</p>
							)}
						</CardDescription>
					</CardHeader>
				</div>
				<div className="w-1/2 md:w-[80%] xl:w-1/2 aspect-square self-center xl:self-start xl:m-0 shrink-0">
					<ThemedChessboard options={chessboardOptions} />
				</div>
			</div>
			<CardFooter>
				<Button asChild>
					<Link href={`/dashboard/matches/${match.id}`}>
						Go to Match
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

export const MatchCard = memo(MatchCardComponent);
