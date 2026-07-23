"use client";
import type { Friendship, Match, User } from "@chess-now/api";
import { ChessNowClient } from "@chess-now/api";
import { SearchXIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppSidebar } from "@/components/dashboard-sidebar";
import { MatchCard } from "@/components/match-card";
import { NotificationsButton } from "@/components/notifications-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export default function UserProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = use(params);
	const [matches, setMatches] = useState<Match[] | null>(null);
	const [friends, setFriends] = useState<Friendship[] | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [client, setClient] = useState<ChessNowClient | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (client) return;

		async function fetchData() {
			try {
				const sessionRes = await authClient.getSession();
				const token = sessionRes.data?.session.token;
				if (!token) {
					setError("Unauthorized");
					return;
				}

				const newClient = new ChessNowClient(
					process.env.NEXT_PUBLIC_BASE_URL as string,
				);
				newClient.setDefaultToken(token);
				setClient(newClient);

				const [info, userMatches, userFriends] = await Promise.all([
					newClient.getUserInfo(username),
					newClient.getUserMatches(username),
					newClient.getUserFriends(username),
				]);

				setUser(info);
				setMatches(userMatches);
				setFriends(userFriends);
			} catch (err) {
				setError((err as Error).message || "Failed to load profile");
			}
		}
		fetchData();
	}, [client, username]);

	if (error) {
		return (
			<div className="flex flex-col gap-4 justify-center items-center w-full h-screen">
				<p className="text-destructive font-semibold">{error}</p>
			</div>
		);
	}

	if (!matches || !user || !friends) {
		return (
			<div className="flex flex-col gap-4 justify-center items-center w-full h-screen">
				<Spinner />
				<p>Loading profile...</p>
			</div>
		);
	}

	const finishedMatches = matches.filter((m) => m.status !== "active");
	const totalFinished = finishedMatches.length;
	let wins = 0;
	let draws = 0;
	let losses = 0;

	for (const m of finishedMatches) {
		if (
			(m.status === "white_won" && m.whitePlayer.id === user.id) ||
			(m.status === "black_won" && m.blackPlayer.id === user.id)
		) {
			wins++;
		} else if (m.status === "draw") {
			draws++;
		} else {
			losses++;
		}
	}

	const winRate =
		totalFinished > 0 ? Math.round((wins / totalFinished) * 100) : 0;

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
									<BreadcrumbPage
										href="/account/dashboard/friends"
										className="text-foreground/65 hover:text-foreground/75 hover:underline"
									>
										Users
									</BreadcrumbPage>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>
										{user.name} (@{user.username})
									</BreadcrumbPage>
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
					<div className="flex flex-col gap-6 max-w-7xl mx-auto">
						<div>
							<h2 className="text-2xl font-bold mb-4">
								{user.name}'s Profile
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-lg">
											Profile Info
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex flex-col gap-3">
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground text-sm">
													Name
												</span>
												<span className="font-medium">
													{user.name}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground text-sm">
													Username
												</span>
												<span className="font-medium">
													@{user.username}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground text-sm">
													Joined
												</span>
												<span className="font-medium">
													{new Date(
														user.createdAt,
													).toLocaleDateString()}
												</span>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-lg">
											Stats
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex flex-col gap-2 text-sm">
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">
													Matches Played
												</span>
												<span className="font-bold">
													{matches.length}
												</span>
											</div>
											<Separator className="my-1" />
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">
													Wins
												</span>
												<span className="font-bold text-emerald-500/80">
													{wins}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">
													Draws
												</span>
												<span className="font-bold text-amber-500/80">
													{draws}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">
													Losses
												</span>
												<span className="font-bold text-rose-500/80">
													{losses}
												</span>
											</div>
											<Separator className="my-1" />
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">
													Win Rate
												</span>
												<span className="font-bold">
													{winRate}%
												</span>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
							<div className="xl:col-span-3 md:col-span-2 h-full rounded-xl bg-muted/50 p-4 flex flex-col gap-3">
								<div>
									<h3 className="text-lg font-semibold">
										Matches ({matches.length})
									</h3>
								</div>
								<div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
									{matches.map((match) => (
										<MatchCard
											key={match.id}
											match={match}
											user={user}
										/>
									))}
								</div>
								{matches.length === 0 && (
									<div className="w-full p-10 flex flex-col justify-center items-center gap-1">
										<SearchXIcon />
										<p>No matches found.</p>
									</div>
								)}
							</div>

							<div className="col-span-1 h-fit flex-1 rounded-xl bg-muted/50 p-4">
								<div className="pb-4">
									<h3 className="text-lg font-semibold flex items-center gap-2">
										<UsersIcon className="h-5 w-5" />
										Friends ({friends.length})
									</h3>
								</div>
								<div className="flex flex-col gap-2">
									{friends.map((friendship) => {
										const friend =
											friendship.userA.id === user.id
												? friendship.userB
												: friendship.userA;
										return (
											<Link
												key={friendship.id}
												href={`/users/${friend.username}`}
												className="flex gap-2 p-2 items-center border rounded-md bg-background/50 hover:bg-muted/80 transition-colors"
											>
												<Avatar>
													<AvatarFallback>
														{friend.name
															.charAt(0)
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="text-sm truncate">
														{friend.name}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														@{friend.username}
													</p>
												</div>
											</Link>
										);
									})}
									{friends.length === 0 && (
										<div className="p-6 flex flex-col items-center gap-1 text-muted-foreground text-sm">
											<SearchXIcon className="h-4 w-4" />
											<p>This user has no friends :C</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
