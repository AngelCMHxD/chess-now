"use client";

import type * as React from "react";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavSecondary({
	items,
	...props
}: {
	items: (
		| {
				title: string;
				url: string;
				onclick: undefined;
				icon: React.ReactNode;
		  }
		| {
				title: string;
				onclick: () => void;
				url: undefined;
				icon: React.ReactNode;
		  }
	)[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild size="sm">
								{item.url ? (
									<a href={item.url}>
										{item.icon}
										<span>{item.title}</span>
									</a>
								) : (
									<button
										type="button"
										onClick={item.onclick}
									>
										{item.icon}
										<span>{item.title}</span>
									</button>
								)}
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
