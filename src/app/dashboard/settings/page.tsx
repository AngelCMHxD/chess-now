"use client";

import type { User } from "@chess-now/api";
import { ChessNowClient } from "@chess-now/api";
import {
	AtSignIcon,
	HelpCircleIcon,
	KeyRoundIcon,
	UserIcon,
} from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";

export default function SettingsPage() {
	const [client, setClient] = useState<ChessNowClient | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [initialLoading, setInitialLoading] = useState(true);

	useEffect(() => {
		async function fetchData() {
			try {
				const sessionRes = await authClient.getSession();
				const token = sessionRes.data?.session.token;
				if (!token) return;

				const activeClient = new ChessNowClient(
					process.env.NEXT_PUBLIC_BASE_URL as string,
				);
				activeClient.setDefaultToken(token);
				setClient(activeClient);

				const accInfo = await activeClient.getAccountInfo();
				setUser(accInfo);
				setName(accInfo.name);
				setUsername(accInfo.username);
			} catch (_err) {
				toast.error("Failed to load account settings");
			} finally {
				setInitialLoading(false);
			}
		}
		fetchData();
	}, []);

	if (initialLoading || !user) {
		return (
			<div className="flex flex-col gap-4 justify-center items-center w-full h-screen">
				<Spinner />
				<p>Loading settings...</p>
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
									<BreadcrumbPage>Settings</BreadcrumbPage>
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
					<div className="h-full flex-1 rounded-xl bg-muted/50 p-4 md:p-8">
						<div className="max-w-2xl mx-auto">
							<h2 className="text-2xl font-bold tracking-tight mb-4">
								Account Settings
							</h2>

							<Tabs defaultValue="profile">
								<TabsList className="gap-1">
									<TabsTrigger value="profile">
										<UserIcon />
										Profile
									</TabsTrigger>
									<TabsTrigger value="change-password">
										<KeyRoundIcon />
										Change Password
									</TabsTrigger>
								</TabsList>

								<ProfileTab
									client={client}
									setUser={setUser}
									user={user}
									setName={setName}
									name={name}
									setUsername={setUsername}
									username={username}
								/>

								<ChangePasswordTab />
							</Tabs>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

function ProfileTab({
	user,
	setUser,
	name,
	setName,
	username,
	setUsername,
	client,
}: {
	user: User;
	setUser: Dispatch<SetStateAction<User | null>>;
	name: string;
	setName: Dispatch<SetStateAction<string>>;
	username: string;
	setUsername: Dispatch<SetStateAction<string>>;
	client: ChessNowClient | null;
}) {
	const [loading, setLoading] = useState(false);

	const normalizeUsernameInput = (value: string) =>
		value.toLowerCase().replace(/[^a-z0-9]/g, "");

	const handleSave = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!client || !user) return;

		setLoading(true);
		try {
			const updatedUser = await client.updateAccountInfo({
				name: name.trim(),
				username: username.trim(),
			});
			setUser(updatedUser);
			toast.success("Profile updated successfully!");
		} catch (err: unknown) {
			toast.error(
				(err as { message?: string }).message ||
					"Failed to update profile",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<TabsContent value="profile">
			<Card className="overflow-hidden">
				<CardContent>
					<form onSubmit={handleSave}>
						<FieldGroup>
							<div className="flex flex-col gap-2">
								<h1 className="text-xl font-bold">
									Profile Details
								</h1>
							</div>
							<Field>
								<FieldLabel htmlFor="name">
									Display Name
								</FieldLabel>
								<Input
									id="name"
									placeholder="Your Name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="username">
									Username
								</FieldLabel>
								<InputGroup>
									<InputGroupAddon>
										<AtSignIcon />
									</InputGroupAddon>
									<InputGroupInput
										id="username"
										type="text"
										placeholder="johndoe"
										value={username}
										onChange={(e) =>
											setUsername(
												normalizeUsernameInput(
													e.target.value,
												),
											)
										}
										required
									/>
								</InputGroup>
							</Field>
							<Button
								type="submit"
								disabled={
									loading ||
									(name === user.name &&
										username === user.username)
								}
							>
								{loading ? (
									<Spinner className="mr-2 h-4 w-4" />
								) : null}
								Save Changes
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</TabsContent>
	);
}

function ChangePasswordTab() {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");
	const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
	const [changingPassword, setChangingPassword] = useState(false);

	const handleChangePassword = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (newPassword !== confirmNewPassword) {
			toast.error("New passwords do not match", {
				position: "bottom-center",
			});
			return;
		}

		setChangingPassword(true);
		const { error } = await authClient.changePassword({
			newPassword,
			currentPassword,
			revokeOtherSessions,
		});

		if (error) {
			toast.error(error.message || error.statusText, {
				position: "bottom-center",
			});
		} else {
			toast.success("Password changed successfully!", {
				position: "bottom-center",
			});
			setCurrentPassword("");
			setNewPassword("");
			setConfirmNewPassword("");
		}
		setChangingPassword(false);
	};

	return (
		<TabsContent value="change-password">
			<Card className="overflow-hidden">
				<CardContent>
					<form onSubmit={handleChangePassword}>
						<FieldGroup>
							<div className="flex flex-col gap-2">
								<h1 className="text-xl font-bold">
									Change Password
								</h1>
							</div>
							<Field>
								<FieldLabel htmlFor="currentPassword">
									Current Password
								</FieldLabel>
								<Input
									id="currentPassword"
									type="password"
									value={currentPassword}
									onChange={(e) =>
										setCurrentPassword(e.target.value)
									}
									required
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="newPassword">
									New Password
								</FieldLabel>
								<Input
									id="newPassword"
									type="password"
									value={newPassword}
									onChange={(e) =>
										setNewPassword(e.target.value)
									}
									required
								/>
							</Field>
							<Field
								data-invalid={
									newPassword !== confirmNewPassword &&
									confirmNewPassword.length > 0
								}
							>
								<FieldLabel htmlFor="confirmNewPassword">
									Confirm New Password
								</FieldLabel>
								<Input
									id="confirmNewPassword"
									type="password"
									value={confirmNewPassword}
									onChange={(e) =>
										setConfirmNewPassword(e.target.value)
									}
									required
								/>
							</Field>
							<div className="flex items-center gap-2">
								<Checkbox
									id="revokeOtherSessions"
									checked={revokeOtherSessions}
									onCheckedChange={(checked) =>
										setRevokeOtherSessions(!!checked)
									}
								/>
								<label
									htmlFor="revokeOtherSessions"
									className="font-medium flex items-center"
								>
									Revoke other sessions
									<TooltipProvider delayDuration={150}>
										<Tooltip>
											<TooltipTrigger asChild>
												<HelpCircleIcon className="w-4 h-4 ml-1.5 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent
												className="flex flex-col gap-1"
												side="right"
											>
												<p>
													This also revokes external
													apps.
												</p>
												<p>
													Doesn't regenerate bot
													tokens
												</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</label>
							</div>
							<Button
								type="submit"
								disabled={
									changingPassword ||
									!currentPassword ||
									!newPassword ||
									!confirmNewPassword ||
									newPassword !== confirmNewPassword
								}
							>
								{changingPassword ? (
									<Spinner className="mr-2 h-4 w-4" />
								) : null}
								Change Password
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</TabsContent>
	);
}
