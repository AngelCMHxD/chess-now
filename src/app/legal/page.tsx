import { FileTextIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react/jsx-runtime";
import Header from "@/components/header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

const integrationsData: {
	title: string;
	icon: () => JSX.Element;
	url: string;
}[] = [
	{
		title: "Terms & Conditions",
		icon: () => <FileTextIcon className="size-10" />,
		url: "/legal/terms",
	},
	{
		title: "Privacy Policy",
		icon: () => <ShieldCheckIcon className="size-10" />,
		url: "/legal/privacy",
	},
];

export default function LegalPage() {
	return (
		<div className="relative">
			<Header />

			<main className="flex flex-col items-center h-screen w-screen">
				<h1 className="text-3xl leading-[1.29167] font-bold text-balance sm:text-4xl lg:text-5xl pt-30">
					Legal
				</h1>

				<p className="p-10">For legal reasons I guess...</p>

				<div className="grid grid-cols-1 gap-4 max-w-prose">
					{integrationsData.map((item) => (
						<Link href={item.url} key={item.title}>
							<Card className="p-8 hover:bg-secondary transition">
								<CardContent className="flex">
									<div className="pr-4">
										<item.icon />
									</div>
									<div className="flex flex-col justify-center">
										<CardTitle>{item.title}</CardTitle>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</main>
		</div>
	);
}
