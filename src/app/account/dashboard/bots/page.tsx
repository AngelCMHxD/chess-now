"use client";
import type { User } from "@chess-now/api";
import { ChessNowClient } from "@chess-now/api";
import {
	AtSignIcon,
	CheckIcon,
	CopyIcon,
	KeyRoundIcon,
	PlusIcon,
	Trash2Icon,
	UserPenIcon,
	UserXIcon,
} from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
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
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
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
import { authClient } from "@/lib/auth-client";

type TokenDialogType = {
	open: boolean;
	token: string | null;
	botName: string;
};

type ChangeInfoDialogType = {
	open: boolean;
	botName: string;
	botUsername: string;
	botId: string;
};

export default function BotsPage() {
	const [bots, setBots] = useState<User[] | null>(null);

	const [tokenDialog, setTokenDialog] = useState<TokenDialogType>({
		open: false,
		token: null,
		botName: "",
	});
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

	const [client, setClient] = useState<ChessNowClient | null>(null);

	useEffect(() => {
		let activeClient: ChessNowClient | null = null;

		const fetchBots = async () => {
			try {
				const sessionRes = await authClient.getSession();
				const token = sessionRes.data?.session.token;
				if (!token || !sessionRes.data?.user) return;

				activeClient = new ChessNowClient(
					process.env.NEXT_PUBLIC_BASE_URL as string,
				);
				activeClient.setDefaultToken(token);
				setClient(activeClient);

				const botsResult = await activeClient.getMyBots(token);
				setBots(botsResult);
			} catch (error) {
				console.error(error);
			}
		};
		fetchBots();

		return () => {
			if (activeClient) {
				activeClient.disconnect();
			}
		};
	}, []);

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

								<CreateDialog
									client={client}
									setBots={setBots}
									setTokenDialog={setTokenDialog}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 w-full">
								<TooltipProvider>
									{bots.map((bot) => (
										<BotCard
											key={bot.id}
											actionLoadingId={actionLoadingId}
											bot={bot}
											setBots={setBots}
											client={client}
											setActionLoadingId={
												setActionLoadingId
											}
											setTokenDialog={setTokenDialog}
										/>
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

				<TokenDialog
					tokenDialog={tokenDialog}
					setTokenDialog={setTokenDialog}
				/>
			</SidebarInset>
		</SidebarProvider>
	);
}

function ChangeInfoDialog({
	setBots,
	client,
}: {
	setBots: Dispatch<SetStateAction<User[] | null>>;
	client: ChessNowClient | null;
}) {
	const [changeInfoDialog, setChangeInfoDialog] =
		useState<ChangeInfoDialogType>({
			open: false,
			botId: "",
			botName: "",
			botUsername: "",
		});
	const [isUpdating, setIsUpdating] = useState(false);

	const handleUpdateBot = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (
			(!changeInfoDialog.botName && !changeInfoDialog.botUsername) ||
			!client
		)
			return;

		setIsUpdating(true);
		try {
			const result = await client.updateBotInfo(changeInfoDialog.botId, {
				name: changeInfoDialog.botName,
				username: changeInfoDialog.botUsername,
			});
			setBots((prev) => {
				if (!prev) return null;

				return prev.map((bot) =>
					bot.id === changeInfoDialog.botId ? result : bot,
				);
			});

			setChangeInfoDialog({
				botName: "",
				botId: "",
				botUsername: "",
				open: false,
			});
		} catch (error) {
			console.error(error);
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<Dialog
			open={changeInfoDialog.open}
			onOpenChange={(open) => {
				if (!open)
					setChangeInfoDialog({
						botName: "",
						botId: "",
						botUsername: "",
						open: false,
					});
			}}
		>
			<Tooltip>
				<DialogTrigger asChild>
					<TooltipTrigger asChild>
						<Button
							variant="secondary"
							size="icon"
							onClick={() =>
								setChangeInfoDialog({
									botName: "",
									botId: "",
									botUsername: "",
									open: true,
								})
							}
						>
							<UserPenIcon />
						</Button>
					</TooltipTrigger>
				</DialogTrigger>
				<TooltipContent>Change info</TooltipContent>
			</Tooltip>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change Bot info</DialogTitle>
					<DialogDescription>
						Give your bot a new name or username.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleUpdateBot}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Display Name</Label>
							<Input
								id="name"
								value={changeInfoDialog.botName}
								onChange={(e) =>
									setChangeInfoDialog((prev) => ({
										...prev,
										botName: e.target.value,
									}))
								}
								required
								placeholder="Stockfish Level 1"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="username">Username</Label>
							<InputGroup>
								<InputGroupAddon>
									<AtSignIcon />
								</InputGroupAddon>
								<InputGroupInput
									id="username"
									value={changeInfoDialog.botUsername}
									onChange={(e) =>
										setChangeInfoDialog((prev) => ({
											...prev,
											botUsername: e.target.value,
										}))
									}
									required
									placeholder="stockfish_1"
								/>
							</InputGroup>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="submit"
							disabled={
								isUpdating ||
								(!changeInfoDialog.botName &&
									!changeInfoDialog.botUsername)
							}
						>
							{isUpdating ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : null}
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function BotCard({
	bot,
	setBots,
	setTokenDialog,
	client,
	setActionLoadingId,
	actionLoadingId,
}: {
	bot: User;
	setBots: Dispatch<SetStateAction<User[] | null>>;
	setTokenDialog: Dispatch<SetStateAction<TokenDialogType>>;
	client: ChessNowClient | null;
	setActionLoadingId: Dispatch<SetStateAction<string | null>>;
	actionLoadingId: string | null;
}) {
	const handleResetToken = async (botId: string, botName: string) => {
		if (!client) return;
		setActionLoadingId(botId);
		try {
			const apiKey = await client.resetBotToken(botId);
			setTokenDialog({
				open: true,
				token: apiKey.key,
				botName,
			});
		} catch (error) {
			console.error(error);
		} finally {
			setActionLoadingId(null);
		}
	};

	const handleDeleteBot = async (botId: string) => {
		if (!client) return;
		setActionLoadingId(botId);
		try {
			await client.deleteBot(botId);
			setBots((prev) => (prev ? prev.filter((b) => b.id !== botId) : []));
		} catch (error) {
			console.error(error);
		} finally {
			setActionLoadingId(null);
		}
	};

	return (
		<Card size="default" className="w-full overflow-hidden p-0">
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
									{new Date(bot.createdAt).toLocaleString()}
								</p>
								<p>Bot ID: {bot.id}</p>
							</div>
						</CardDescription>
					</CardHeader>
					<div className="w-1/4 flex flex-col items-center justify-center gap-2 p-2">
						<ChangeInfoDialog setBots={setBots} client={client} />

						<AlertDialog>
							<Tooltip>
								<AlertDialogTrigger asChild>
									<TooltipTrigger asChild>
										<Button
											variant="secondary"
											size="icon"
											disabled={
												actionLoadingId === bot.id
											}
										>
											{actionLoadingId === bot.id ? (
												<Spinner />
											) : (
												<KeyRoundIcon />
											)}
										</Button>
									</TooltipTrigger>
								</AlertDialogTrigger>
								<TooltipContent>Reset Token</TooltipContent>
							</Tooltip>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Are you sure?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This will revoke the old token. Any
										instances using the old token will stop
										working
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={() =>
											handleResetToken(bot.id, bot.name)
										}
									>
										Continue
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<AlertDialog>
							<Tooltip>
								<AlertDialogTrigger asChild>
									<TooltipTrigger asChild>
										<Button
											variant="destructive"
											size="icon"
											disabled={
												actionLoadingId === bot.id
											}
										>
											{actionLoadingId === bot.id ? (
												<Spinner />
											) : (
												<Trash2Icon />
											)}
										</Button>
									</TooltipTrigger>
								</AlertDialogTrigger>
								<TooltipContent>Delete Bot</TooltipContent>
							</Tooltip>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Are you sure?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This cannot be undone
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										onClick={() => handleDeleteBot(bot.id)}
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
	);
}

function CreateDialog({
	setBots,
	setTokenDialog,
	client,
}: {
	setBots: Dispatch<SetStateAction<User[] | null>>;
	setTokenDialog: Dispatch<SetStateAction<TokenDialogType>>;
	client: ChessNowClient | null;
}) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [createName, setCreateName] = useState("");
	const [createUsername, setCreateUsername] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const handleCreateBot = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!createName || !createUsername || !client) return;
		setIsCreating(true);
		try {
			const result = await client.registerBot({
				name: createName,
				username: createUsername,
			});
			setBots((prev) => (prev ? [...prev, result.bot] : [result.bot]));
			setIsCreateOpen(false);
			setCreateName("");
			setCreateUsername("");
			setTokenDialog({
				open: true,
				token: result.apiKey.key,
				botName: result.bot.name,
			});
		} catch (error) {
			console.error(error);
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
			<DialogTrigger asChild>
				<Button>
					<PlusIcon className="mr-2 h-4 w-4" /> Create Bot
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create a new Bot</DialogTitle>
					<DialogDescription>
						Give your bot a display name and a unique username.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleCreateBot}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Display Name</Label>
							<Input
								id="name"
								value={createName}
								onChange={(e) => setCreateName(e.target.value)}
								required
								placeholder="Stockfish Level 1"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="username">Username</Label>
							<InputGroup>
								<InputGroupAddon>
									<AtSignIcon />
								</InputGroupAddon>
								<InputGroupInput
									id="username"
									value={createUsername}
									onChange={(e) =>
										setCreateUsername(e.target.value)
									}
									required
									placeholder="stockfish_1"
								/>
							</InputGroup>
						</div>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={isCreating}>
							{isCreating ? (
								<Spinner className="mr-2 h-4 w-4" />
							) : null}
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function TokenDialog({
	tokenDialog,
	setTokenDialog,
}: {
	tokenDialog: TokenDialogType;
	setTokenDialog: Dispatch<SetStateAction<TokenDialogType>>;
}) {
	const [hasCopied, setHasCopied] = useState(false);

	const handleCopy = () => {
		if (tokenDialog.token) {
			navigator.clipboard.writeText(tokenDialog.token);
			setHasCopied(true);
			setTimeout(() => setHasCopied(false), 2000);
		}
	};

	return (
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
					<DialogTitle>Token for {tokenDialog.botName}</DialogTitle>
					<DialogDescription>
						Make sure to copy your token. You won't be able to see
						it again!
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
	);
}
