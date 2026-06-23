import HeroSection from "@/components/blocks/hero/hero";
import Header from "@/components/header";

export default function Home() {
	return (
		<div className="relative">
			<Header />

			<main className="flex flex-col">
				<HeroSection />
			</main>
		</div>
	);
}
