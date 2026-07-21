"use client";

import type { Challenge, FriendRequest } from "@chess-now/api";
import { BellIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

type NotificationItem =
	| { type: "challenge"; data: Challenge; id: string; date: Date }
	| { type: "friend_request"; data: FriendRequest; id: string; date: Date };

export function NotificationsButton() {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const fetchNotifications = useCallback(async () => {
		setLoading(true);
		try {
			const [challengesRes, friendsRes, sessionRes] = await Promise.all([
				fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/challenges`, {
					credentials: "include",
				}),
				fetch(
					`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/friend-requests`,
					{ credentials: "include" },
				),
				authClient.getSession(),
			]);

			const challengesJson = await challengesRes.json();
			const friendsJson = await friendsRes.json();
			const userId = sessionRes.data?.user?.id;

			const items: NotificationItem[] = [];

			if (challengesJson.success) {
				const incomingChallenges = (
					challengesJson.data as Challenge[]
				).filter((c) => c.toId === userId && c.status === "pending");
				for (const c of incomingChallenges) {
					items.push({
						type: "challenge",
						data: c,
						id: `challenge-${c.id}`,
						date: new Date(c.createdAt),
					});
				}
			}

			if (friendsJson.success) {
				const incomingFriends = (
					friendsJson.data as FriendRequest[]
				).filter((f) => f.toId === userId && f.status === "pending");
				for (const f of incomingFriends) {
					items.push({
						type: "friend_request",
						data: f,
						id: `friend_request-${f.id}`,
						date: new Date(f.createdAt),
					});
				}
			}

			items.sort((a, b) => b.date.getTime() - a.date.getTime());
			setNotifications(items);
		} catch (_error) {
			toast.error("Failed to load notifications");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			fetchNotifications();
		}
	}, [isOpen, fetchNotifications]);

	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	const handleRejectChallenge = async (e: React.MouseEvent, id: number) => {
		e.preventDefault();
		if (actionLoading) return;
		setActionLoading(`challenge-${id}`);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/challenges/${id}/deny`,
				{
					method: "POST",
					credentials: "include",
				},
			);
			if (res.ok) {
				toast.success("Challenge rejected");
				fetchNotifications();
			} else {
				toast.error("Failed to reject challenge");
			}
		} catch (_error) {
			toast.error("An error occurred");
		} finally {
			setActionLoading(null);
		}
	};

	const handleAcceptFriend = async (
		e: React.MouseEvent,
		username: string,
		id: number,
	) => {
		e.preventDefault();
		if (actionLoading) return;
		setActionLoading(`friend_request-${id}-accept`);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/friend-requests/${username}/accept`,
				{
					method: "POST",
					credentials: "include",
				},
			);
			if (res.ok) {
				toast.success("Friend request accepted");
				fetchNotifications();
			} else {
				toast.error("Failed to accept friend request");
			}
		} catch (_error) {
			toast.error("An error occurred");
		} finally {
			setActionLoading(null);
		}
	};

	const handleRejectFriend = async (
		e: React.MouseEvent,
		username: string,
		id: number,
	) => {
		e.preventDefault();
		if (actionLoading) return;
		setActionLoading(`friend_request-${id}-reject`);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/friend-requests/${username}/deny`,
				{
					method: "POST",
					credentials: "include",
				},
			);
			if (res.ok) {
				toast.success("Friend request rejected");
				fetchNotifications();
			} else {
				toast.error("Failed to reject friend request");
			}
		} catch (_error) {
			toast.error("An error occurred");
		} finally {
			setActionLoading(null);
		}
	};

	// AI Disclaimer: Used to improve the looks of the button
	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					aria-label="Notifications"
					className="relative"
				>
					<BellIcon />
					{notifications.length > 0 && (
						<span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-600" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-80 max-h-96 overflow-y-auto"
			>
				<DropdownMenuLabel>Notifications</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{loading && notifications.length === 0 ? (
					<div className="p-4 flex justify-center">
						<Spinner />
					</div>
				) : notifications.length === 0 ? (
					<div className="p-4 text-center text-sm text-muted-foreground">
						No new notifications
					</div>
				) : (
					<div className="flex flex-col">
						{notifications.map((item) => (
							<div
								key={item.id}
								className="flex flex-col items-start gap-2 p-3 border-b last:border-b-0"
							>
								{item.type === "challenge" ? (
									<>
										<div className="text-sm">
											<span className="font-medium">
												Challenge
											</span>{" "}
											from {item.data.from?.name} (@
											{item.data.from?.username})
										</div>
										<div className="flex gap-2 w-full justify-end">
											<Button
												size="sm"
												variant="destructive"
												onClick={(e) =>
													handleRejectChallenge(
														e,
														item.data.id,
													)
												}
												disabled={!!actionLoading}
											>
												{actionLoading ===
												`challenge-${item.data.id}` ? (
													<Spinner className="w-4 h-4" />
												) : (
													"Reject"
												)}
											</Button>
										</div>
									</>
								) : (
									<>
										<div className="text-sm">
											<span className="font-medium">
												Friend Request
											</span>{" "}
											from {item.data.from?.name} (@
											{item.data.from?.username})
										</div>
										<div className="flex gap-2 w-full justify-end">
											<Button
												size="sm"
												variant="outline"
												onClick={(e) =>
													handleRejectFriend(
														e,
														item.data.from.username,
														item.data.id,
													)
												}
												disabled={!!actionLoading}
											>
												{actionLoading ===
												`friend_request-${item.data.id}-reject` ? (
													<Spinner className="w-4 h-4" />
												) : (
													"Reject"
												)}
											</Button>
											<Button
												size="sm"
												onClick={(e) =>
													handleAcceptFriend(
														e,
														item.data.from.username,
														item.data.id,
													)
												}
												disabled={!!actionLoading}
											>
												{actionLoading ===
												`friend_request-${item.data.id}-accept` ? (
													<Spinner className="w-4 h-4" />
												) : (
													"Accept"
												)}
											</Button>
										</div>
									</>
								)}
							</div>
						))}
					</div>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
