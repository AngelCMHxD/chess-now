import type { Match, User } from "@chess-now/api";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatMiliseconds } from "@/lib/utils";

export interface GameInfo {
	turn: "w" | "b" | null;
	moves: string[];
	capturedByWhite: string[];
	capturedByBlack: string[];
}

export function MatchNotFound() {
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

export function NotPlayer({ matchId }: { matchId: number }) {
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
					<Link href={`/matches/${matchId}`}>
						<AlertDialogAction>Spectate</AlertDialogAction>
					</Link>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function MatchDetailsCard({
	match,
	user,
	gameInfo,
}: {
	match: Match;
	user?: User | null;
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
							ratingDiff={match.whiteRatingDiff}
						/>
						<Separator />
						<PlayerRow
							player={match.blackPlayer}
							color="b"
							gameInfo={gameInfo}
							isUser={user?.id === match.blackId}
							ratingDiff={match.blackRatingDiff}
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
	ratingDiff,
}: {
	player: User;
	color: "w" | "b";
	gameInfo: GameInfo;
	isUser?: boolean;
	ratingDiff: number | null;
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
					<div className="flex items-center gap-1">
						<p className="font-medium">{player.name}</p>
						{ratingDiff !== null && (
							<span
								className={
									ratingDiff > 0
										? "text-emerald-500/80 font-bold text-xs"
										: ratingDiff < 0
											? "text-rose-500/80 font-bold text-xs"
											: "font-bold text-xs"
								}
							>
								(
								{ratingDiff > 0
									? `+${ratingDiff}`
									: `${ratingDiff}`}
								)
							</span>
						)}
					</div>
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
