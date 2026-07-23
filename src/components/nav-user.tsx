"use client";

import type { User } from "@chess-now/api";
import { ChevronsUpDownIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export function NavUser({ user, loading }: { user?: User; loading: boolean }) {
	const router = useRouter();
	const { isMobile } = useSidebar();

	if (user?.image === null) user.image = undefined;

	const handleLogout = async () => {
		authClient.signOut();
		toast.success("Logged out successfully");
		await new Promise((resolve) => setTimeout(resolve, 1000));
		router.push("/account/login");
	};

	if (loading || !user)
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<Skeleton className="size-8 shrink-0 rounded-full" />
								<div className="grid flex-1 text-left text-sm leading-tight gap-1">
									<Skeleton className="h-3 w-12.5" />
									<Skeleton className="h-3 w-31.25" />
								</div>
								<ChevronsUpDownIcon className="ml-auto size-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-full">
								<AvatarImage src={user.image} alt={user.name} />
								<AvatarFallback className="rounded-full">
									{(user.name ?? "")
										.split(" ")
										.map((n) => n[0])
										.join("")
										.slice(0, 2)
										.toUpperCase() || "CN"}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{user.name}
								</span>
								<span className="truncate text-xs font-extralight">
									@{user.username}
								</span>
							</div>
							<ChevronsUpDownIcon className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal flex items-center">
							<div className="flex flex-1 items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-full">
									<AvatarImage
										src={user.image}
										alt={user.name}
									/>
									<AvatarFallback className="rounded-full">
										{(user.name ?? "")
											.split(" ")
											.map((n) => n[0])
											.join("")
											.slice(0, 2)
											.toUpperCase() || "CN"}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{user.name}
									</span>
									<span className="truncate text-xs">
										@{user.username}
									</span>
								</div>
							</div>
							<Button variant="ghost" size="icon-lg" asChild>
								<Link href="/account/dashboard/settings">
									<SettingsIcon />
								</Link>
							</Button>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleLogout}
							className="text-destructive"
						>
							<LogOutIcon />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
