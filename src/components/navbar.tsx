"use client";

import { ChevronRightIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function Navbar({
	items,
	name = "Main",
}: {
	items: {
		title: string;
		url: string;
		icon: React.ReactNode;
		items?: {
			title: string;
			url: string;
		}[];
	}[];
	name?: string;
}) {
	const pathname = usePathname();

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{name}</SidebarGroupLabel>
			<SidebarMenu className="gap-1">
				{items.map((item) => {
					const mainActive = pathname.startsWith(item.url);
					const childActive = item.items?.some(
						(subItem) => pathname === subItem.url,
					);

					return item.items ? (
						<Collapsible
							key={item.title}
							asChild
							defaultOpen={mainActive || childActive}
						>
							<SidebarMenuItem>
								<SidebarMenuButton asChild tooltip={item.title}>
									<a href={item.url}>
										{item.icon}
										<span>{item.title}</span>
									</a>
								</SidebarMenuButton>
								{item.items?.length ? (
									<>
										<CollapsibleTrigger asChild>
											<SidebarMenuAction className="data-[state=open]:rotate-90">
												<ChevronRightIcon />
												<span className="sr-only">
													Toggle
												</span>
											</SidebarMenuAction>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<SidebarMenuSub>
												{item.items?.map((subItem) => {
													const isSubItemActive =
														pathname ===
														subItem.url;

													return (
														<SidebarMenuSubItem
															key={subItem.title}
														>
															<SidebarMenuSubButton
																asChild
																isActive={
																	isSubItemActive
																}
															>
																<a
																	href={
																		subItem.url
																	}
																>
																	<span>
																		{
																			subItem.title
																		}
																	</span>
																</a>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													);
												})}
											</SidebarMenuSub>
										</CollapsibleContent>
									</>
								) : null}
							</SidebarMenuItem>
						</Collapsible>
					) : (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								tooltip={item.title}
								isActive={mainActive}
							>
								<a href={item.url}>
									{item.icon}
									<span>{item.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
