import type { NavigationSection } from "@/components/blocks/hero/header";
import Header from "@/components/blocks/hero/header";
import HeroSection from "@/components/blocks/hero/hero";

const navigationData: NavigationSection[] = [
	{
		title: "Integrations",
		href: "/about/integrations",
	},
	{
		title: "Why this proyect?",
		href: "/about/why",
	},
];

export default function Home() {
	return (
		<div className="relative">
			<Header navigationData={navigationData} />

			<main className="flex flex-col">
				<HeroSection />
			</main>
		</div>
	);
}
