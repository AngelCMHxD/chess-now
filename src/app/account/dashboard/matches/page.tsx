"use client";
import type { User } from "better-auth/types";
import { BellIcon, SearchXIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import type { Match } from "@/api/helper";
import { AppSidebar } from "@/components/dashboard-sidebar";
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
	CardContent,
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

export default function MatchesPage() {
	const [matches, setMatches] = useState<
		(Match & { blackPlayer: User; whitePlayer: User })[] | null
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
			<div className="flex justify-center items-center w-full h-screen">
				<Spinner />
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
					<div className="ms-auto me-5">
						<Button
							variant="outline"
							size="icon"
							aria-label="Submit"
						>
							<BellIcon />
						</Button>
					</div>
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
					<div className="grid grid-cols-3 gap-4 w-full">
						{matches.map((match) => (
							<Card
								size="default"
								className="w-full overflow-hidden p-0"
								key={match.id}
							>
								<div className="flex flex-col md:flex-row">
									<div className="flex flex-col justify-between w-full">
										<CardHeader>
											<CardTitle className="pt-4">
												{match.whitePlayer.name} vs{" "}
												{match.blackPlayer.name}
											</CardTitle>
											<CardDescription>
												Duration:{" "}
												{match.finishedAt?.toLocaleDateString()}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<p>
												* Winner:{" "}
												{match.status === "white_won"
													? match.whitePlayer.name
													: match.status ===
															"black_won"
														? match.blackPlayer.name
														: "Draw"}
											</p>
										</CardContent>
									</div>
									<div className="w-1/2 aspect-square">
										<Chessboard
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
					<div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min">
						{matches && matches.length === 0 && (
							<div className="w-full h-full flex flex-col justify-center items-center gap-1">
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
