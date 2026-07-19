"use client";
import type { ApiSuccessResponse, Friendship, User } from "@chess-now/api";
import { BellIcon, Trash2Icon, UserXIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/dashboard-sidebar";
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

export default function MatchesPage() {
	const [friendships, setFriendships] = useState<Friendship[] | null>(null);
	const [myId, setMyId] = useState<string>("");

	useEffect(() => {
		async function fetchData() {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/friends`,
				{
					credentials: "include",
				},
			);
			const result = await res.json();
			setFriendships(result.data);

			const idRes = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me`,
				{
					credentials: "include",
				},
			);
			const idResult = (await idRes.json()) as ApiSuccessResponse<User>;
			setMyId(idResult.data.id);
		}
		fetchData();
	}, []);

	if (!friendships) {
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
									<BreadcrumbPage>Friends</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
					<div className="ms-auto me-5 flex gap-2">
						<Button
							variant="outline"
							size="icon"
							aria-label="Submit"
						>
							<BellIcon />
						</Button>
						<div className="flex justify-end max-w-full">
							<ThemeSwitcher popupAlign="end" />
						</div>
					</div>
				</header>
				<div className="p-5 h-full">
					<div className="h-full flex-1 rounded-xl bg-muted/50 pt-4">
						<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 w-full">
								{friendships.map((friendship) => (
									<Card
										size="default"
										className="w-full overflow-hidden p-0"
										key={friendship.id}
									>
										<div className="flex flex-col xl:flex-row h-full">
											<div className="flex flex-row justify-between w-full">
												<CardHeader className="w-3/4">
													<CardTitle className="pt-4">
														{friendship.userAId ===
														myId
															? friendship.userBId
															: friendship.userAId}
													</CardTitle>
													<CardDescription>
														<div className="pb-4">
															<p>
																Friend since:{" "}
																{friendship.createdAt?.toLocaleString()}
															</p>
														</div>
													</CardDescription>
												</CardHeader>
												<div className="w-1/5 flex items-center justify-center">
													<Button
														className="hover:bg-destructive"
														size="icon"
													>
														<Trash2Icon />
													</Button>
												</div>
											</div>
										</div>
									</Card>
								))}
							</div>
						</div>
						{friendships && friendships.length === 0 && (
							<div className="w-full h-full flex flex-col justify-center items-center gap-3 pb-4">
								<UserXIcon />
								<p className="text-center">
									No friends found.
									<br />
									Start adding friends!
								</p>
							</div>
						)}
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
