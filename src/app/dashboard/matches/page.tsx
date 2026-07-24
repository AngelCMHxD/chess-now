"use client";
import type { Match, User } from "@chess-now/api";
import { ChessNowClient } from "@chess-now/api";
import { SearchXIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/dashboard-sidebar";
import { MatchCard } from "@/components/match-card";
import { NotificationsButton } from "@/components/notifications-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
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
import { authClient } from "@/lib/auth-client";

export default function MatchesPage() {
	const [matches, setMatches] = useState<Match[] | null>(null);

	const [user, setUser] = useState<User | null>(null);
	const [client, setClient] = useState<ChessNowClient | null>(null);

	const [sendChallengeOpen, setSendChallengeOpen] = useState(false);
	const [challengeUsername, setChallengeUsername] = useState("");
	const [sendingChallenge, setSendingChallenge] = useState(false);

	async function handleSendChallenge() {
		if (!challengeUsername.trim() || !client) return;
		setSendingChallenge(true);
		try {
			await client.requestChallenge(challengeUsername.trim());
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
		let activeClient: ChessNowClient | null = null;

		async function fetchData() {
			try {
				const sessionRes = await authClient.getSession();
				const token = sessionRes.data?.session.token;
				if (!token || !sessionRes.data?.user) return;

				activeClient = new ChessNowClient(
					process.env.NEXT_PUBLIC_BASE_URL as string,
				);
				activeClient.setDefaultToken(token);
				setClient(activeClient);

				const matchesResult = await activeClient.getMyMatches(token);

				setUser(sessionRes.data?.user as unknown as User);
				setMatches(matchesResult as Match[]);

				await activeClient.connect();
				activeClient.subscribe(["challenge", "match"]);

				activeClient.on("challenge:accepted", (event) => {
					setMatches((prev) => {
						if (!prev) return [event.payload.match];

						if (prev.some((m) => m.id === event.payload.match.id))
							return prev;

						return [event.payload.match, ...prev];
					});
				});

				activeClient.on("match:board_move", (event) => {
					setMatches((prev) => {
						if (!prev) return null;

						const newMatches: Match[] = [];
						prev.forEach((m) => {
							if (m.id === event.payload.match.id)
								newMatches.push(event.payload.match);
							else newMatches.push(m);
						});

						return newMatches;
					});
				});

				activeClient.on("match:game_over", (event) => {
					setMatches((prev) => {
						if (!prev) return null;

						const newMatches: Match[] = [];
						prev.forEach((m) => {
							if (m.id === event.payload.match.id)
								newMatches.push(event.payload.match);
							else newMatches.push(m);
						});

						return newMatches;
					});
				});
			} catch (error) {
				console.error(error);
			}
		}
		fetchData();

		return () => {
			if (activeClient) {
				activeClient.disconnect();
			}
		};
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
										href="/dashboard"
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
								{matches
									.sort(
										(a, b) =>
											b.createdAt.getTime() -
											a.createdAt.getTime(),
									)
									.map((match) => (
										<MatchCard
											key={match.id}
											match={match}
											user={user}
										/>
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
