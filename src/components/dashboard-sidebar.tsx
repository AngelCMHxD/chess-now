"use client";

import {
	BookOpenIcon,
	ChartColumnIcon,
	MessageSquareHeartIcon,
	UsersIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { NavUser } from "@/components/nav-user";
import { Navbar } from "@/components/navbar";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient, type Session } from "@/lib/auth-client";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";

const navMain = [
	{
		title: "Match History",
		url: "/account/dashboard/matches",
		icon: <ChartColumnIcon />,
	},
	{
		title: "Friends",
		url: "/account/dashboard/friends",
		icon: <UsersIcon />,
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [session, setSession] = React.useState<Session | null>(null);
	const [loading, setLoading] = React.useState(true);

	const pathname = usePathname();

	React.useEffect(() => {
		authClient.getSession().then((session) => {
			setSession(session.data as Session);
			setLoading(false);
		});
	}, []);

	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							isActive={pathname === "/account/dashboard"}
							asChild
						>
							<a href="/account/dashboard">
								<div className="flex aspect-square size-7 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
									<Image
										alt="Chess Now! Icon"
										width="8"
										height="8"
										src="/icon.svg"
										className="h-full w-auto"
									/>
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										Chess Now!
									</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<Navbar items={navMain} />
				<SidebarGroup className="mt-auto">
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<Link
									href="/docs"
									target="_blank"
									rel="noopener noreferrer"
								>
									<SidebarMenuButton
										asChild
										size="sm"
										className="cursor-pointer"
									>
										<div>
											<BookOpenIcon />
											<span>Documentation</span>
										</div>
									</SidebarMenuButton>
								</Link>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<Dialog>
									<DialogTrigger asChild>
										<SidebarMenuButton
											asChild
											size="sm"
											className="cursor-pointer"
										>
											<div>
												<MessageSquareHeartIcon />
												<span>Feedback</span>
											</div>
										</SidebarMenuButton>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>
												Got any feedback?
											</DialogTitle>
											<DialogDescription>
												Any kind of feedback on what to
												improve, what to add or any bug
												report is appreciated and
												encouraged!
												<br />
												<br />
												Leave it over at the project's
												repo issue tracker so I can keep
												it organized :P
											</DialogDescription>
										</DialogHeader>
										<DialogFooter>
											<DialogClose asChild>
												<Button variant="outline">
													Cancel
												</Button>
											</DialogClose>
											<Button asChild>
												<Link
													href={`${process.env.NEXT_PUBLIC_REPO_LINK}/issues`}
													target="_blank"
													rel="noopener noreferrer"
												>
													Go to Issue Tracker
												</Link>
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={session?.user} loading={loading} />
			</SidebarFooter>
		</Sidebar>
	);
}
