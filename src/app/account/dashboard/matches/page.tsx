"use client";
import type { Match, PublicUser } from "@chess-now/api";
import { SearchXIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { formatMiliseconds } from "@/lib/utils";

export default function MatchesPage() {
	const [matches, setMatches] = useState<
		(Match & { blackPlayer: PublicUser; whitePlayer: PublicUser })[] | null
	>(null);

	useEffect(() => {
		async function fetchData() {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/matches`,
				{
					credentials: "include",
				},
			);
			const result = await res.json();
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
						<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
								{matches.map((match) => (
									<Card
										size="default"
										className="w-full overflow-hidden p-0"
										key={match.id}
									>
										<div className="flex flex-col xl:flex-row h-full">
											<div className="flex flex-col justify-between w-full">
												<CardHeader>
													<CardTitle className="pt-4">
														{match.whitePlayer.name}{" "}
														vs{" "}
														{match.blackPlayer.name}
													</CardTitle>
													<CardDescription>
														{match.status ===
														"active" ? (
															<p>
																Started at:{" "}
																{match.createdAt?.toLocaleString()}
																<br />
																Active
															</p>
														) : (
															<p>
																Duration:{" "}
																{formatMiliseconds(
																	(match.finishedAt?.getTime() ||
																		0) -
																		match.createdAt?.getTime(),
																)}
																<br />
																{match.endReason ===
																"checkmate"
																	? `Winner: ${
																			match.status ===
																			"white_won"
																				? match
																						.whitePlayer
																						.name
																				: match
																						.blackPlayer
																						.name
																		}`
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
													}}
												/>
											</div>
										</div>
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
