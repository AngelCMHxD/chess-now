import type { Match, User } from "@chess-now/api";
import Link from "next/link";
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

export function MatchCard({
	match,
	user,
}: {
	match: Match;
	user: User | null;
}) {
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
													default:
														return "Unknown";
												}
											})()}`}
								</p>
							)}
						</CardDescription>
					</CardHeader>
				</div>
				<div className="w-1/2 md:w-[80%] xl:w-1/2 aspect-square self-center xl:self-start xl:m-0 shrink-0">
					<ThemedChessboard
						options={{
							allowDragging: false,
							position: match.fen,
							showNotation: false,
							boardOrientation:
								match.whitePlayer.id === user?.id
									? "white"
									: "black",
						}}
					/>
				</div>
			</div>
			<CardFooter>
				<Button asChild>
					<Link href={`/play/${match.id}`}>Go to Match</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
