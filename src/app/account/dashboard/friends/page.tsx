"use client";
import type { ApiSuccessResponse, Friendship, User } from "@chess-now/api";
import { PlusIcon, Trash2Icon, UserXIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/dashboard-sidebar";
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
	Card,
	CardDescription,
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";

export default function FriendsPage() {
	const [friendships, setFriendships] = useState<Friendship[] | null>(null);
	const [myId, setMyId] = useState<string>("");

	const [addFriendPopOpen, setAddFriendPopOpen] = useState(false);
	const [friendReqUsername, setFriendReqUsername] = useState("");
	const [addLoading, setAddLoading] = useState(false);

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

	const handleAddFriend = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!friendReqUsername.trim()) return;
		setAddLoading(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/friends/add/${friendReqUsername.trim()}`,
				{
					method: "POST",
					credentials: "include",
				},
			);
			if (res.ok) {
				toast.success("Friend request sent!");
				setAddFriendPopOpen(false);
				setFriendReqUsername("");
			} else {
				const err = await res.json();
				toast.error(err.message || "Failed to send friend request");
			}
		} catch (_error) {
			toast.error("An error occurred while sending the request.");
		} finally {
			setAddLoading(false);
		}
	};

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
						<NotificationsButton />
						<div className="flex justify-end max-w-full">
							<ThemeSwitcher popupAlign="end" />
						</div>
					</div>
				</header>
				<div className="p-5 h-full">
					<div className="h-full flex-1 rounded-xl bg-muted/50 pt-4">
						<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-bold tracking-tight">
									Your Friends
								</h2>

								<Dialog
									open={addFriendPopOpen}
									onOpenChange={setAddFriendPopOpen}
								>
									<DialogTrigger asChild>
										<Button>
											<PlusIcon className="mr-2 h-4 w-4" />{" "}
											Add Friend
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>
												Send Friend Request
											</DialogTitle>
											<DialogDescription>
												Enter the username of the person
												you want to add as a friend.
											</DialogDescription>
										</DialogHeader>
										<form onSubmit={handleAddFriend}>
											<div className="grid gap-4 py-4">
												<div className="grid gap-2">
													<Label htmlFor="username">
														Username
													</Label>
													<Input
														id="username"
														value={
															friendReqUsername
														}
														onChange={(e) =>
															setFriendReqUsername(
																e.target.value,
															)
														}
														required
														placeholder="username"
													/>
												</div>
											</div>
											<DialogFooter>
												<Button
													type="submit"
													disabled={addLoading}
												>
													{addLoading ? (
														<Spinner className="mr-2 h-4 w-4" />
													) : null}
													Send Request
												</Button>
											</DialogFooter>
										</form>
									</DialogContent>
								</Dialog>
							</div>

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
															? `${friendship.userB.name} (@${friendship.userB.username})`
															: `${friendship.userA.name} (@${friendship.userA.username})`}
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
