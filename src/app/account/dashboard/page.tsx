"use client";
import React from "react";
import { AppSidebar } from "@/components/dashboard-sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { authClient, type Session } from "@/lib/auth-client";

export default function DashboardPage() {
	const [session, setSession] = React.useState<Session | null>(null);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		authClient.getSession().then((session) => {
			setSession(session.data as Session);
			setLoading(false);
		});
	}, []);

	if (loading) {
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
							className="mr-2 data-[orientation=vertical]:h-4"
						/>
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbPage>Dashboard</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
					<div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min">
						<div className="flex flex-col gap-4 p-4 justify-center items-center h-full">
							<h1 className="text-2xl font-bold">
								Welcome, {session?.user?.name}.
							</h1>
							<p>
								You can find the available options on the
								sidebar.
							</p>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
