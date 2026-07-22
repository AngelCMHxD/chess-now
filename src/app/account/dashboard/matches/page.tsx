"use client";
import type { Match, User } from "@chess-now/api";
import { SearchXIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/dashboard-sidebar";
import { NotificationsButton } from "@/components/notifications-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ThemedChessboard } from "@/components/themed-chessboard";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { formatMiliseconds } from "@/lib/utils";

function parseDateReviver(_key: string, value: unknown): unknown {
	if (typeof value === "string") {
		const isoDateRegex =
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
		if (isoDateRegex.test(value)) {
			return new Date(value);
		}
	}
	return value;
}

export default function MatchesPage() {
	const [matches, setMatches] = useState<
		(Match & { blackPlayer: User; whitePlayer: User })[] | null
	>(null);

	const [user, setUser] = useState<User | null>(null);

	const [sendChallengeOpen, setSendChallengeOpen] = useState(false);
	const [challengeUsername, setChallengeUsername] = useState("");
	const [sendingChallenge, setSendingChallenge] = useState(false);

	async function handleSendChallenge() {
		if (!challengeUsername.trim()) return;
		setSendingChallenge(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/challenge/request/${challengeUsername.trim()}`,
				{
					method: "POST",
					credentials: "include",
				},
			);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || "Failed to send challenge");
			}
			toast.success(`Challenge sent to ${challengeUsername}`);
			setSendChallengeOpen(false);
			setChallengeUsername("");
		} catch (error) {
			toast.error((error as Error).message);
		} finally {
			setSendingChallenge(false);
		}
	}

	useEffect(() => {
		async function fetchData() {
			const matchesRes = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/matches`,
				{
					credentials: "include",
				},
			);
			const result = JSON.parse(
				await matchesRes.text(),
				parseDateReviver,
			);

			const userRes = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me`,
				{
					credentials: "include",
				},
			).then((res) => res.json());

			setUser(userRes.data);
			setMatches(result.data);
		}
		fetchData();
	}, []);

	if (!matches) {
		return (
			<div className="flex flex-col gap-4 justify-center items-center w-full h-screen">
				<Spinner />
				<p>This might take a while...</p>
			</div>
		);
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-8"
						/>
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbPage
										href="/account/dashboard"
										className="text-foreground/65 hover:text-foreground/75 hover:underline"
									>
										Dashboard
									</BreadcrumbPage>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>Matches</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
					<div className="ms-auto me-5 flex gap-2">
						<NotificationsButton />
						<div className="flex justify-end max-w-full">
							<ThemeSwitcher popupAlign="end" />
						</div>
					</div>
				</header>
				<div className="p-5 h-full">
					<div className="h-full flex-1 rounded-xl bg-muted/50 pt-4">
						<div className="flex items-center justify-between px-4 pb-4">
							<h2 className="text-lg font-semibold">
								Your Matches
							</h2>
							<Dialog
								open={sendChallengeOpen}
								onOpenChange={setSendChallengeOpen}
							>
								<DialogTrigger asChild>
									<Button>Send Challenge</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>
											Send Challenge
										</DialogTitle>
										<DialogDescription>
											Enter the username of the player you
											want to send a challenge to
										</DialogDescription>
									</DialogHeader>
									<div className="flex gap-2">
										<Input
											value={challengeUsername}
											onChange={(e) =>
												setChallengeUsername(
													e.target.value,
												)
											}
											placeholder="Username"
											onKeyDown={(e) =>
												e.key === "Enter" &&
												handleSendChallenge()
											}
										/>
									</div>
									<DialogFooter>
										<Button
											onClick={handleSendChallenge}
											disabled={
												!challengeUsername ||
												sendingChallenge
											}
										>
											{sendingChallenge ? (
												<Spinner />
											) : (
												"Send"
											)}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
						<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
								{matches.map((match) => (
									<Card
										size="default"
										className="w-full overflow-hidden p-0 gap-0"
										key={match.id}
									>
										<div className="flex flex-col xl:flex-row h-full">
											<div className="flex flex-col justify-between w-full">
												<CardHeader>
													<CardTitle className="pt-4">
														vs.{" "}
														{user?.id ===
														match.whitePlayer.id
															? `${match.blackPlayer.name} (@${match.blackPlayer.username})`
															: `${match.whitePlayer.name} (@${match.whitePlayer.username})`}
													</CardTitle>
													<CardDescription>
														{match.status ===
														"active" ? (
															<p>
																Started at:{" "}
																{match.createdAt.toLocaleString()}
																<br />
																Active
															</p>
														) : (
															<p>
																Duration:{" "}
																{formatMiliseconds(
																	(match.finishedAt?.getTime() ||
																		0) -
																		match.createdAt.getTime(),
																)}
																<br />
																{match.endReason ===
																"checkmate"
																	? `Winner: ${(() => {
																			const winner =
																				match.status ===
																				"white_won"
																					? match.whitePlayer
																					: match.blackPlayer;

																			if (
																				winner.id ===
																				user?.id
																			) {
																				return "You";
																			}

																			return winner.name;
																		})()}`
																	: `Draw: ${(() => {
																			switch (
																				match.endReason
																			) {
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
															match.whitePlayer
																.id === user?.id
																? "white"
																: "black",
													}}
												/>
											</div>
										</div>
										<CardFooter>
											<Button asChild>
												<Link
													href={`/play/${match.id}`}
												>
													Go to Match
												</Link>
											</Button>
										</CardFooter>
									</Card>
								))}
							</div>
						</div>
						{matches && matches.length === 0 && (
							<div className="w-full h-full flex flex-col justify-center items-center gap-1 pb-4">
								<SearchXIcon />
								<p>No matches found.</p>
							</div>
						)}
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
