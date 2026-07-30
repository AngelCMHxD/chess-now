import { GlobeIcon, TerminalSquareIcon } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react/jsx-runtime";
import Header from "@/components/header";
import { DiscordIcon } from "@/components/icons/discord-icon";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/components/ui/card";

const integrationsData: {
	title: string;
	icon: () => JSX.Element;
	description: string;
	footer?: () => JSX.Element | null;
}[] = [
	{
		title: "Web",
		icon: () => <GlobeIcon className="size-10" />,
		description: "It's... well... the whole dashboard?",
	},
	{
		title: "Discord",
		icon: () => <DiscordIcon className="size-10" />,
		description: "A pretty simple and barebones Discord bot",
		footer: () => {
			if (!process.env.NEXT_PUBLIC_DISCORD_SERVER_URL) return null;

			return (
				<div className="flex gap-2">
					<Button>
						<Link href={process.env.NEXT_PUBLIC_DISCORD_SERVER_URL}>
							Join Main Server
						</Link>
					</Button>
				</div>
			);
		},
	},
	{
		title: "TUI",
		icon: () => <TerminalSquareIcon className="size-10" />,
		description:
			"A simple Terminal User Interface (TUI) so you look like a hackerman",
		footer: () => (
			<div className="flex gap-2">
				{process.env.NEXT_PUBLIC_REPO_LINK && (
					<Button>
						<Link
							href={`${process.env.NEXT_PUBLIC_REPO_LINK}/releases`}
						>
							Go to GitHub Releases
						</Link>
					</Button>
				)}
			</div>
		),
	},
];

export default function IntegrationsPage() {
	return (
		<div className="relative">
			<Header />

			<main className="flex flex-col items-center h-screen w-screen">
				<h1 className="text-3xl leading-[1.29167] font-bold text-balance sm:text-4xl lg:text-5xl p-15 pt-30">
					Integrations
				</h1>

				<div className="grid grid-cols-1 gap-4 max-w-prose">
					{integrationsData.map((item) => (
						<Card key={item.title} className="p-6">
							<CardContent className="flex">
								<div className="pr-4">
									<item.icon />
								</div>
								<div className="flex flex-col justify-center">
									<CardTitle>{item.title}</CardTitle>
									<CardDescription>
										{item.description}
									</CardDescription>
								</div>
							</CardContent>
							{item.footer && <item.footer />}
						</Card>
					))}
				</div>
			</main>
		</div>
	);
}
