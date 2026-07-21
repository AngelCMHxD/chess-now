"use client";
import type { User } from "@chess-now/api";
import {
	CheckIcon,
	CopyIcon,
	KeyRoundIcon,
	PlusIcon,
	Trash2Icon,
	UserXIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
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
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BotsPage() {
	const [bots, setBots] = useState<User[] | null>(null);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [createName, setCreateName] = useState("");
	const [createUsername, setCreateUsername] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const [tokenDialog, setTokenDialog] = useState<{
		open: boolean;
		token: string | null;
		botName: string;
	}>({ open: false, token: null, botName: "" });
	const [hasCopied, setHasCopied] = useState(false);
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

	useEffect(() => {
		const fetchBots = async () => {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/bots`,
				{
					credentials: "include",
				},
			);
			const result = await res.json();
			setBots(result.data);
		};
		fetchBots();
	}, []);

	const handleCreateBot = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!createName || !createUsername) return;
		setIsCreating(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/bots`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: createName,
						username: createUsername,
					}),
					credentials: "include",
				},
			);
			const result = await res.json();
			if (result.success) {
				setBots((prev) =>
					prev ? [...prev, result.data.bot] : [result.data.bot],
				);
				setIsCreateOpen(false);
				setCreateName("");
				setCreateUsername("");
				setTokenDialog({
					open: true,
					token: result.data.apiKey.key,
					botName: result.data.bot.name,
				});
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleDeleteBot = async (botId: string) => {
		setActionLoadingId(botId);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/bots/${botId}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);
			const result = await res.json();
			if (result.success) {
				setBots((prev) =>
					prev ? prev.filter((b) => b.id !== botId) : [],
				);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setActionLoadingId(null);
		}
	};

	const handleResetToken = async (botId: string, botName: string) => {
		setActionLoadingId(botId);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/me/bots/${botId}/reset_token`,
				{
					method: "POST",
					credentials: "include",
				},
			);
			const result = await res.json();
			if (result.success) {
				setTokenDialog({
					open: true,
					token: result.data.key,
					botName,
				});
			}
		} catch (error) {
			console.error(error);
		} finally {
			setActionLoadingId(null);
		}
	};

	const handleCopy = () => {
		if (tokenDialog.token) {
			navigator.clipboard.writeText(tokenDialog.token);
			setHasCopied(true);
			setTimeout(() => setHasCopied(false), 2000);
		}
	};

	if (!bots) {
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
									<BreadcrumbPage>Bots</BreadcrumbPage>
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
									Your Bots
								</h2>

								<Dialog
									open={isCreateOpen}
									onOpenChange={setIsCreateOpen}
								>
									<DialogTrigger asChild>
										<Button>
											<PlusIcon className="mr-2 h-4 w-4" />{" "}
											Create Bot
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>
												Create a new Bot
											</DialogTitle>
											<DialogDescription>
												Give your bot a display name and
												a unique username.
											</DialogDescription>
										</DialogHeader>
										<form onSubmit={handleCreateBot}>
											<div className="grid gap-4 py-4">
												<div className="grid gap-2">
													<Label htmlFor="name">
														Display Name
													</Label>
													<Input
														id="name"
														value={createName}
														onChange={(e) =>
															setCreateName(
																e.target.value,
															)
														}
														required
														placeholder="Stockfish Level 1"
													/>
												</div>
												<div className="grid gap-2">
													<Label htmlFor="username">
														Username
													</Label>
													<Input
														id="username"
														value={createUsername}
														onChange={(e) =>
															setCreateUsername(
																e.target.value,
															)
														}
														required
														placeholder="stockfish_1"
													/>
												</div>
											</div>
											<DialogFooter>
												<Button
													type="submit"
													disabled={isCreating}
												>
													{isCreating ? (
														<Spinner className="mr-2 h-4 w-4" />
													) : null}
													Create
												</Button>
											</DialogFooter>
										</form>
									</DialogContent>
								</Dialog>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 w-full">
								<TooltipProvider>
									{bots.map((bot) => (
										<Card
											size="default"
											className="w-full overflow-hidden p-0"
											key={bot.id}
										>
											<div className="flex flex-col xl:flex-row h-full">
												<div className="flex flex-row justify-between w-full">
													<CardHeader className="w-3/4">
														<CardTitle className="pt-4 break-all">
															{bot.name} <br />
															<span className="text-muted-foreground text-sm font-normal">
																@{bot.username}
															</span>
														</CardTitle>
														<CardDescription>
															<div className="pb-4">
																<p>
																	Created at:{" "}
																	{new Date(
																		bot.createdAt,
																	).toLocaleString()}
																</p>
																<p>
																	Bot ID:{" "}
																	{bot.id}
																</p>
															</div>
														</CardDescription>
													</CardHeader>
													<div className="w-1/4 flex flex-col items-center justify-center gap-2 p-2">
														<AlertDialog>
															<Tooltip>
																<AlertDialogTrigger
																	asChild
																>
																	<TooltipTrigger
																		asChild
																	>
																		<Button
																			variant="secondary"
																			size="icon"
																			disabled={
																				actionLoadingId ===
																				bot.id
																			}
																		>
																			{actionLoadingId ===
																			bot.id ? (
																				<Spinner />
																			) : (
																				<KeyRoundIcon />
																			)}
																		</Button>
																	</TooltipTrigger>
																</AlertDialogTrigger>
																<TooltipContent>
																	Reset Token
																</TooltipContent>
															</Tooltip>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Are you
																		sure?
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		This
																		will
																		revoke
																		the old
																		token.
																		Any
																		instances
																		using
																		the old
																		token
																		will
																		stop
																		working
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>
																		Cancel
																	</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() =>
																			handleResetToken(
																				bot.id,
																				bot.name,
																			)
																		}
																	>
																		Continue
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>

														<AlertDialog>
															<Tooltip>
																<AlertDialogTrigger
																	asChild
																>
																	<TooltipTrigger
																		asChild
																	>
																		<Button
																			variant="destructive"
																			size="icon"
																			disabled={
																				actionLoadingId ===
																				bot.id
																			}
																		>
																			{actionLoadingId ===
																			bot.id ? (
																				<Spinner />
																			) : (
																				<Trash2Icon />
																			)}
																		</Button>
																	</TooltipTrigger>
																</AlertDialogTrigger>
																<TooltipContent>
																	Delete Bot
																</TooltipContent>
															</Tooltip>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Are you
																		sure?
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		This
																		cannot
																		be
																		undone
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>
																		Cancel
																	</AlertDialogCancel>
																	<AlertDialogAction
																		variant="destructive"
																		onClick={() =>
																			handleDeleteBot(
																				bot.id,
																			)
																		}
																	>
																		Continue
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</div>
												</div>
											</div>
										</Card>
									))}
								</TooltipProvider>
							</div>
						</div>
						{bots && bots.length === 0 && (
							<div className="w-full h-full flex flex-col justify-center items-center gap-3 pb-4">
								<UserXIcon className="h-10 w-10 text-muted-foreground" />
								<p className="text-center text-muted-foreground">
									No bots found.
									<br />
									Create a bot to get started!
								</p>
							</div>
						)}
					</div>
				</div>

				<Dialog
					open={tokenDialog.open}
					onOpenChange={(open) => {
						if (!open)
							setTokenDialog({
								open: false,
								token: null,
								botName: "",
							});
					}}
				>
					<DialogContent showCloseButton={false}>
						<DialogHeader>
							<DialogTitle>
								Token for {tokenDialog.botName}
							</DialogTitle>
							<DialogDescription>
								Make sure to copy your token. You won't be able
								to see it again!
							</DialogDescription>
						</DialogHeader>
						<div className="flex items-center space-x-2 my-4">
							<Input value={tokenDialog.token || ""} readOnly />
							<Button size="icon" onClick={handleCopy}>
								{hasCopied ? (
									<CheckIcon className="h-4 w-4" />
								) : (
									<CopyIcon className="h-4 w-4" />
								)}
							</Button>
						</div>
						<DialogFooter showCloseButton={true} />
					</DialogContent>
				</Dialog>
			</SidebarInset>
		</SidebarProvider>
	);
}
