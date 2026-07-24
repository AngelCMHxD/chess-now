"use client";
import type { Friendship, User } from "@chess-now/api";
import { ChessNowClient } from "@chess-now/api";
import {
	SendIcon,
	Trash2Icon,
	UserIcon,
	UserSearchIcon,
	UserXIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/dashboard-sidebar";
import { NotificationsButton } from "@/components/notifications-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";

export default function FriendsPage() {
	const [friendships, setFriendships] = useState<Friendship[] | null>(null);
	const [myId, setMyId] = useState<string>("");

	const [buttonLoadingId, setButtonLoadingId] = useState<number | null>(null);
	const [challengeLoadingId, setChallengeLoadingId] = useState<number | null>(
		null,
	);
	const [client, setClient] = useState<ChessNowClient | null>(null);

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

				const friendsResult = await activeClient.getFriends(token);
				setFriendships(friendsResult);
				setMyId(sessionRes.data.user.id);

				await activeClient.connect();
				activeClient.subscribe(["friend"]);

				activeClient.on("friend:accepted", (event) => {
					setFriendships((prev) => {
						if (!prev) return [event.payload.friendship];
						if (
							prev.some(
								(f) => f.id === event.payload.friendship.id,
							)
						)
							return prev;
						return [...prev, event.payload.friendship];
					});
				});

				activeClient.on("friend:removed", (event) => {
					setFriendships((prev) => {
						if (!prev) return null;
						return prev.filter(
							(f) => f.id !== event.payload.friendship.id,
						);
					});
				});
			} catch (_error) {
				toast.error("Failed to load friends");
			}
		}
		fetchData();

		return () => {
			if (activeClient) {
				activeClient.disconnect();
			}
		};
	}, []);

	const handleDeleteFriend = async (
		friendshipId: number,
		username: string,
	) => {
		if (!client) return;
		setButtonLoadingId(friendshipId);
		try {
			await client.removeFriend(username);
			toast.success("Friend removed");
			setFriendships((prev) =>
				prev ? prev.filter((f) => f.id !== friendshipId) : [],
			);
		} catch (error: unknown) {
			toast.error(
				(error as { message?: string }).message ||
					"Failed to remove friend",
			);
		} finally {
			setButtonLoadingId(null);
		}
	};

	const handleChallenge = async (friendshipId: number, username: string) => {
		if (!client) return;
		setChallengeLoadingId(friendshipId);
		try {
			await client.requestChallenge(username);
			toast.success("Challenge sent!");
		} catch (error: unknown) {
			toast.error(
				(error as { message?: string }).message ||
					"Failed to send challenge",
			);
		} finally {
			setChallengeLoadingId(null);
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
										href="/dashboard"
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

								<SearchUserDialog />
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 w-full">
								{friendships.map((friendship) => {
									const otherUser =
										friendship.userAId === myId
											? friendship.userB
											: friendship.userA;

									return (
										<Card
											size="default"
											className="w-full overflow-hidden p-0"
											key={friendship.id}
										>
											<div className="flex flex-col xl:flex-row h-full">
												<div className="flex flex-row justify-between w-full">
													<CardHeader className="flex-1">
														<CardTitle className="pt-4">
															{`${otherUser.name} (@${otherUser.username})`}
														</CardTitle>
														<CardDescription>
															<div className="pb-4">
																<p>
																	Friend
																	since:
																	<br />
																	{new Date(
																		friendship.createdAt,
																	).toLocaleDateString()}
																</p>
															</div>
														</CardDescription>
													</CardHeader>
													<div className="shrink-0 flex items-center justify-end gap-2 pr-6">
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<Button
																	variant="outline"
																	size="icon"
																	asChild
																>
																	<Link
																		href={`/users/${otherUser.username}`}
																	>
																		<UserIcon />
																	</Link>
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p>
																	View Profile
																</p>
															</TooltipContent>
														</Tooltip>

														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<Button
																	variant="outline"
																	size="icon"
																	disabled={
																		challengeLoadingId ===
																		friendship.id
																	}
																	onClick={() =>
																		handleChallenge(
																			friendship.id,
																			otherUser.username,
																		)
																	}
																>
																	{challengeLoadingId ===
																	friendship.id ? (
																		<Spinner />
																	) : (
																		<SendIcon />
																	)}
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p>
																	Send
																	Challenge
																</p>
															</TooltipContent>
														</Tooltip>

														<RemoveFriendDialog
															otherUser={
																otherUser
															}
															isLoading={
																buttonLoadingId ===
																friendship.id
															}
															onRemove={() =>
																handleDeleteFriend(
																	friendship.id,
																	otherUser.username,
																)
															}
														/>
													</div>
												</div>
											</div>
										</Card>
									);
								})}
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

function SearchUserDialog() {
	const [open, setOpen] = useState(false);
	const [username, setUsername] = useState("");
	const router = useRouter();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim()) return;
		router.push(`/users/${username.trim()}`);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<UserSearchIcon className="mr-2 h-4 w-4" /> Search User
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Search User</DialogTitle>
					<DialogDescription>
						Enter the username of the person you want to find.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSearch}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								placeholder="username"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="submit">Search</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function RemoveFriendDialog({
	otherUser,
	isLoading,
	onRemove,
}: {
	otherUser: User;
	isLoading: boolean;
	onRemove: () => void;
}) {
	return (
		<AlertDialog>
			<Tooltip>
				<AlertDialogTrigger asChild>
					<TooltipTrigger asChild>
						<Button
							variant="destructive"
							size="icon"
							disabled={isLoading}
						>
							{isLoading ? <Spinner /> : <Trash2Icon />}
						</Button>
					</TooltipTrigger>
				</AlertDialogTrigger>
				<TooltipContent>
					<p>Remove Friend</p>
				</TooltipContent>
			</Tooltip>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
					<AlertDialogDescription>
						You are about to remove {otherUser.name} from your
						friends list
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction variant="destructive" onClick={onRemove}>
						Remove
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
